package handler

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/griotandgrits/platform/apps/api/internal/config"
	"github.com/griotandgrits/platform/apps/api/internal/service"
)

func newTestAuthHandler(t *testing.T, cfg config.AuthConfig) (*AuthHandler, *service.AuthService) {
	t.Helper()
	if cfg.Secret == "" {
		cfg.Secret = "unit-test-secret"
	}
	if cfg.PublicBaseURL == "" {
		cfg.PublicBaseURL = "http://api.test"
	}
	if cfg.DefaultRedirect == "" {
		cfg.DefaultRedirect = "http://app.test/admin"
	}
	authSvc := service.NewAuthService(cfg)
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return NewAuthHandler(authSvc, cfg.PublicBaseURL, cfg.DefaultRedirect, logger), authSvc
}

// devBypassRoundTrip — GET /auth/github with dev bypass should set a session
// cookie and redirect to the callback URL.
func TestStartLogin_DevBypass_SetsSessionAndRedirects(t *testing.T) {
	h, svc := newTestAuthHandler(t, config.AuthConfig{DevBypass: true})

	req := httptest.NewRequest(http.MethodGet, "/auth/github?callback=/admin/upload", nil)
	rec := httptest.NewRecorder()
	h.StartLogin(rec, req)

	if rec.Code != http.StatusFound {
		t.Fatalf("status: got %d, want 302", rec.Code)
	}

	loc := rec.Header().Get("Location")
	if !strings.HasSuffix(loc, "/admin/upload") {
		t.Errorf("Location: got %q, want suffix /admin/upload", loc)
	}

	cookies := rec.Result().Cookies()
	var sess *http.Cookie
	for _, c := range cookies {
		if c.Name == svc.SessionCookieName() {
			sess = c
		}
	}
	if sess == nil {
		t.Fatalf("expected %q cookie to be set; got cookies: %+v", svc.SessionCookieName(), cookies)
	}
	if sess.Value == "" {
		t.Error("session cookie has empty value")
	}

	parsed, err := svc.VerifySession(sess.Value)
	if err != nil {
		t.Fatalf("session cookie failed verify: %v", err)
	}
	if parsed.User.Role != "admin" {
		t.Errorf("user.role: got %q, want %q", parsed.User.Role, "admin")
	}
}

// GetSession — round-trip a valid signed cookie returns the user envelope.
func TestGetSession_ValidCookie_ReturnsUser(t *testing.T) {
	h, svc := newTestAuthHandler(t, config.AuthConfig{DevBypass: true})

	token, _, err := svc.SignSession(svc.DevAdmin())
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	req.AddCookie(&http.Cookie{Name: svc.SessionCookieName(), Value: token})
	rec := httptest.NewRecorder()
	h.GetSession(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status: got %d, want 200, body=%s", rec.Code, rec.Body.String())
	}
	body := rec.Body.String()
	if !strings.Contains(body, `"role":"admin"`) {
		t.Errorf("response missing role:admin: %s", body)
	}
}

// GetSession — missing cookie -> 401.
func TestGetSession_NoCookie_ReturnsUnauthorized(t *testing.T) {
	h, _ := newTestAuthHandler(t, config.AuthConfig{DevBypass: true})

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	rec := httptest.NewRecorder()
	h.GetSession(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want 401", rec.Code)
	}
}

// GetSession — tampered cookie -> 401 (HMAC verify catches it).
func TestGetSession_TamperedCookie_ReturnsUnauthorized(t *testing.T) {
	h, svc := newTestAuthHandler(t, config.AuthConfig{DevBypass: true})

	token, _, _ := svc.SignSession(svc.DevAdmin())
	// Flip the last byte of the signature.
	tampered := token[:len(token)-1] + "X"

	req := httptest.NewRequest(http.MethodGet, "/auth/session", nil)
	req.AddCookie(&http.Cookie{Name: svc.SessionCookieName(), Value: tampered})
	rec := httptest.NewRecorder()
	h.GetSession(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status: got %d, want 401", rec.Code)
	}
}

// Logout clears the cookie and redirects.
func TestLogout_ClearsCookieAndRedirects(t *testing.T) {
	h, svc := newTestAuthHandler(t, config.AuthConfig{DevBypass: true})

	req := httptest.NewRequest(http.MethodGet, "/auth/logout", nil)
	rec := httptest.NewRecorder()
	h.Logout(rec, req)

	if rec.Code != http.StatusFound {
		t.Errorf("status: got %d, want 302", rec.Code)
	}
	cleared := false
	for _, c := range rec.Result().Cookies() {
		if c.Name == svc.SessionCookieName() && c.MaxAge < 0 {
			cleared = true
		}
	}
	if !cleared {
		t.Errorf("expected session cookie cleared (MaxAge<0); got cookies: %+v", rec.Result().Cookies())
	}
}

// resolveCallback — relative path is rewritten onto the configured default origin.
func TestResolveCallback_Relative_RewritesOntoDefault(t *testing.T) {
	h, _ := newTestAuthHandler(t, config.AuthConfig{
		DevBypass:       true,
		DefaultRedirect: "https://app.example.com/admin",
	})
	got := h.resolveCallback("/admin/artifacts/abc")
	want := "https://app.example.com/admin/artifacts/abc"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

// resolveCallback — absolute URL on a different origin is rejected (open-redirect protection).
func TestResolveCallback_OffOriginAbsolute_FallsBackToDefault(t *testing.T) {
	h, _ := newTestAuthHandler(t, config.AuthConfig{
		DevBypass:       true,
		DefaultRedirect: "https://app.example.com/admin",
	})
	got := h.resolveCallback("https://evil.example.com/steal")
	if got != "https://app.example.com/admin" {
		t.Errorf("expected fallback to default redirect, got %q", got)
	}
}

// State mint -> verify -> embedded callback survives.
func TestStateRoundTrip(t *testing.T) {
	_, svc := newTestAuthHandler(t, config.AuthConfig{DevBypass: false, GitHubClientID: "x", GitHubClientSecret: "y"})
	state, err := svc.NewState("/admin/upload")
	if err != nil {
		t.Fatalf("NewState: %v", err)
	}
	cb, err := svc.VerifyState(state)
	if err != nil {
		t.Fatalf("VerifyState: %v", err)
	}
	if cb != "/admin/upload" {
		t.Errorf("callback: got %q, want /admin/upload", cb)
	}
}

// OAuthCallback — state cookie mismatch -> 400 (CSRF protection).
func TestOAuthCallback_StateCookieMismatch(t *testing.T) {
	h, svc := newTestAuthHandler(t, config.AuthConfig{
		DevBypass:          false,
		GitHubClientID:     "x",
		GitHubClientSecret: "y",
	})
	state, _ := svc.NewState("/admin")

	q := url.Values{"code": {"abc"}, "state": {state}}
	req := httptest.NewRequest(http.MethodGet, "/auth/github/callback?"+q.Encode(), nil)
	req.AddCookie(&http.Cookie{Name: svc.StateCookieName(), Value: "different-state"})
	rec := httptest.NewRecorder()
	h.OAuthCallback(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status: got %d, want 400", rec.Code)
	}
}
