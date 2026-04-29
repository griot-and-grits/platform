package handler

import (
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/service"
)

type AuthHandler struct {
	auth        *service.AuthService
	logger      *slog.Logger
	publicBase  string // base URL of this API (used for OAuth redirect_uri)
	defaultDest string // fallback redirect after login (e.g. https://www.griotandgrits.org/admin)
}

func NewAuthHandler(auth *service.AuthService, publicBase, defaultDest string, logger *slog.Logger) *AuthHandler {
	return &AuthHandler{
		auth:        auth,
		logger:      logger,
		publicBase:  strings.TrimRight(publicBase, "/"),
		defaultDest: defaultDest,
	}
}

// StartLogin handles GET /auth/github. With dev bypass it sets a dev session
// and redirects. Otherwise it redirects to GitHub for OAuth authorization.
func (h *AuthHandler) StartLogin(w http.ResponseWriter, r *http.Request) {
	callback := h.resolveCallback(r.URL.Query().Get("callback"))

	if h.auth.DevBypassEnabled() {
		h.issueSession(w, h.auth.DevAdmin())
		http.Redirect(w, r, callback, http.StatusFound)
		return
	}
	if !h.auth.GitHubConfigured() {
		writeError(w, http.StatusServiceUnavailable, "auth not configured")
		return
	}

	state, err := h.auth.NewState(callback)
	if err != nil {
		h.logger.Error("mint state", "error", err)
		writeError(w, http.StatusInternalServerError, "auth init failed")
		return
	}
	h.setStateCookie(w, state)
	http.Redirect(w, r, h.auth.GitHubAuthorizeURL(state, h.callbackURL()), http.StatusFound)
}

// DevLogin handles POST /auth/github — used by the sign-in form when in dev
// mode. Accepts an optional `token` form value (matched against ADMIN_DEV_TOKEN
// when set).
func (h *AuthHandler) DevLogin(w http.ResponseWriter, r *http.Request) {
	if !h.auth.DevBypassEnabled() {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	if err := r.ParseForm(); err != nil {
		writeError(w, http.StatusBadRequest, "invalid form")
		return
	}
	token := r.FormValue("token")
	if !h.auth.VerifyDevToken(token) {
		writeError(w, http.StatusUnauthorized, "invalid dev token")
		return
	}
	callback := h.resolveCallback(r.URL.Query().Get("callback"))
	if callback == "" {
		callback = r.FormValue("callback")
		callback = h.resolveCallback(callback)
	}
	h.issueSession(w, h.auth.DevAdmin())
	http.Redirect(w, r, callback, http.StatusFound)
}

// OAuthCallback handles GET /auth/github/callback.
func (h *AuthHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) {
	if errCode := r.URL.Query().Get("error"); errCode != "" {
		h.logger.Warn("oauth error from github", "error", errCode, "desc", r.URL.Query().Get("error_description"))
		http.Redirect(w, r, h.signInWithError("oauth_error"), http.StatusFound)
		return
	}

	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if code == "" || state == "" {
		writeError(w, http.StatusBadRequest, "missing code or state")
		return
	}

	stateCookie, err := r.Cookie(h.auth.StateCookieName())
	if err != nil || stateCookie.Value != state {
		writeError(w, http.StatusBadRequest, "state mismatch")
		return
	}
	callback, err := h.auth.VerifyState(state)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid state: "+err.Error())
		return
	}
	h.clearStateCookie(w)

	user, err := h.auth.ExchangeCode(r.Context(), code, h.callbackURL())
	if err != nil {
		h.logger.Warn("oauth exchange failed", "error", err)
		http.Redirect(w, r, h.signInWithError("not_authorized"), http.StatusFound)
		return
	}
	h.issueSession(w, *user)
	http.Redirect(w, r, h.resolveCallback(callback), http.StatusFound)
}

// GetSession handles GET /auth/session. Returns the user envelope or 401.
func (h *AuthHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(h.auth.SessionCookieName())
	if err != nil {
		writeError(w, http.StatusUnauthorized, "no session")
		return
	}
	sess, err := h.auth.VerifySession(cookie.Value)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid session")
		return
	}
	writeJSON(w, http.StatusOK, service.SessionEnvelope{User: sess.User})
}

// Logout handles GET/POST /auth/logout. Clears the cookie and redirects.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	h.clearSessionCookie(w)
	dest := r.URL.Query().Get("callback")
	if dest == "" {
		dest = h.defaultDest
	}
	if dest == "" {
		writeJSON(w, http.StatusOK, map[string]string{"status": "logged_out"})
		return
	}
	http.Redirect(w, r, dest, http.StatusFound)
}

// --- helpers ---

func (h *AuthHandler) callbackURL() string {
	return h.publicBase + "/auth/github/callback"
}

func (h *AuthHandler) signInWithError(code string) string {
	if h.defaultDest == "" {
		return "/admin/sign-in?error=" + url.QueryEscape(code)
	}
	u, err := url.Parse(h.defaultDest)
	if err != nil {
		return h.defaultDest
	}
	u.Path = "/admin/sign-in"
	q := u.Query()
	q.Set("error", code)
	u.RawQuery = q.Encode()
	return u.String()
}

func (h *AuthHandler) resolveCallback(callback string) string {
	if callback == "" {
		if h.defaultDest != "" {
			return h.defaultDest
		}
		return "/admin"
	}
	// Allow same-origin (relative) callbacks as-is. For absolute URLs, only
	// trust the configured defaultDest origin to avoid open-redirect abuse.
	if strings.HasPrefix(callback, "/") {
		if h.defaultDest != "" {
			if u, err := url.Parse(h.defaultDest); err == nil {
				u.Path = callback
				u.RawQuery = ""
				u.Fragment = ""
				return u.String()
			}
		}
		return callback
	}
	if h.defaultDest != "" {
		base, err := url.Parse(h.defaultDest)
		cb, err2 := url.Parse(callback)
		if err == nil && err2 == nil && base.Host == cb.Host && base.Scheme == cb.Scheme {
			return callback
		}
		return h.defaultDest
	}
	return callback
}

func (h *AuthHandler) issueSession(w http.ResponseWriter, user service.UserInfo) {
	token, exp, err := h.auth.SignSession(user)
	if err != nil {
		h.logger.Error("sign session", "error", err)
		writeError(w, http.StatusInternalServerError, "session sign failed")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     h.auth.SessionCookieName(),
		Value:    token,
		Path:     "/",
		Domain:   h.auth.CookieDomain(),
		Expires:  exp,
		HttpOnly: true,
		Secure:   h.auth.CookieSecure(),
		SameSite: cookieSameSite(h.auth.CookieSecure()),
	})
}

func (h *AuthHandler) setStateCookie(w http.ResponseWriter, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.auth.StateCookieName(),
		Value:    value,
		Path:     "/",
		Domain:   h.auth.CookieDomain(),
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Secure:   h.auth.CookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearStateCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.auth.StateCookieName(),
		Value:    "",
		Path:     "/",
		Domain:   h.auth.CookieDomain(),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.auth.CookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *AuthHandler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     h.auth.SessionCookieName(),
		Value:    "",
		Path:     "/",
		Domain:   h.auth.CookieDomain(),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.auth.CookieSecure(),
		SameSite: cookieSameSite(h.auth.CookieSecure()),
	})
}

func cookieSameSite(secure bool) http.SameSite {
	if secure {
		// Cross-site posts (e.g. SPA on a different subdomain) need SameSite=None.
		// Browsers reject SameSite=None unless Secure is also set.
		return http.SameSiteNoneMode
	}
	return http.SameSiteLaxMode
}
