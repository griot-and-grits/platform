package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/config"
)

const (
	sessionDuration = 7 * 24 * time.Hour
	oauthStateTTL   = 10 * time.Minute
)

type UserInfo struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	GitHubLogin string `json:"githubLogin,omitempty"`
}

type Session struct {
	User UserInfo `json:"user"`
	Exp  int64    `json:"exp"`
}

// SessionEnvelope matches the shape web-v2 expects from /auth/session.
type SessionEnvelope struct {
	User UserInfo `json:"user"`
}

// AuthService handles GitHub OAuth, session signing, and authorization.
type AuthService struct {
	cfg        config.AuthConfig
	httpClient *http.Client
}

func NewAuthService(cfg config.AuthConfig) *AuthService {
	return &AuthService{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// DevBypassEnabled reports whether the dev-admin login path is open.
func (a *AuthService) DevBypassEnabled() bool {
	return a.cfg.DevBypass || a.cfg.GitHubClientID == ""
}

// GitHubConfigured reports whether GitHub OAuth credentials are present.
func (a *AuthService) GitHubConfigured() bool {
	return a.cfg.GitHubClientID != "" && a.cfg.GitHubClientSecret != ""
}

// SessionCookieName returns the cookie name carrying the signed session.
func (a *AuthService) SessionCookieName() string { return "gng_session" }

// StateCookieName returns the cookie name carrying the OAuth state token.
func (a *AuthService) StateCookieName() string { return "gng_oauth_state" }

// CookieDomain returns the configured cookie domain, or empty for host-only.
func (a *AuthService) CookieDomain() string { return a.cfg.CookieDomain }

// CookieSecure reports whether cookies should be flagged Secure.
func (a *AuthService) CookieSecure() bool { return a.cfg.CookieSecure }

// SignSession returns a signed token for the given user and the cookie expiry.
func (a *AuthService) SignSession(user UserInfo) (string, time.Time, error) {
	if a.cfg.Secret == "" {
		return "", time.Time{}, errors.New("auth secret not configured")
	}
	exp := time.Now().Add(sessionDuration)
	sess := Session{User: user, Exp: exp.Unix()}
	payload, err := json.Marshal(sess)
	if err != nil {
		return "", time.Time{}, err
	}
	encoded := base64.RawURLEncoding.EncodeToString(payload)
	sig := hmacSign(a.cfg.Secret, encoded)
	return encoded + "." + sig, exp, nil
}

// VerifySession parses and validates a signed session token.
func (a *AuthService) VerifySession(token string) (*Session, error) {
	if a.cfg.Secret == "" {
		return nil, errors.New("auth secret not configured")
	}
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return nil, errors.New("malformed token")
	}
	expectedSig := hmacSign(a.cfg.Secret, parts[0])
	if !hmac.Equal([]byte(expectedSig), []byte(parts[1])) {
		return nil, errors.New("invalid signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, err
	}
	var sess Session
	if err := json.Unmarshal(payload, &sess); err != nil {
		return nil, err
	}
	if time.Now().Unix() > sess.Exp {
		return nil, errors.New("session expired")
	}
	return &sess, nil
}

// NewState mints a random state token signed with the auth secret. The token
// embeds the callback URL so we can validate it on return without server state.
func (a *AuthService) NewState(callback string) (string, error) {
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	payload := struct {
		Nonce    string `json:"n"`
		Callback string `json:"c"`
		Exp      int64  `json:"e"`
	}{
		Nonce:    hex.EncodeToString(nonce),
		Callback: callback,
		Exp:      time.Now().Add(oauthStateTTL).Unix(),
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	encoded := base64.RawURLEncoding.EncodeToString(raw)
	sig := hmacSign(a.cfg.Secret, encoded)
	return encoded + "." + sig, nil
}

// VerifyState checks the signed state and returns the embedded callback.
func (a *AuthService) VerifyState(token string) (string, error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", errors.New("malformed state")
	}
	expectedSig := hmacSign(a.cfg.Secret, parts[0])
	if !hmac.Equal([]byte(expectedSig), []byte(parts[1])) {
		return "", errors.New("invalid state signature")
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", err
	}
	var payload struct {
		Nonce    string `json:"n"`
		Callback string `json:"c"`
		Exp      int64  `json:"e"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		return "", err
	}
	if time.Now().Unix() > payload.Exp {
		return "", errors.New("state expired")
	}
	return payload.Callback, nil
}

// GitHubAuthorizeURL builds the URL we redirect the user to for OAuth start.
func (a *AuthService) GitHubAuthorizeURL(state, redirectURI string) string {
	q := url.Values{}
	q.Set("client_id", a.cfg.GitHubClientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("scope", "read:user user:email read:org")
	q.Set("state", state)
	return "https://github.com/login/oauth/authorize?" + q.Encode()
}

type githubTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	Error       string `json:"error"`
	ErrorDesc   string `json:"error_description"`
}

type githubUser struct {
	Login string `json:"login"`
	Name  string `json:"name"`
	Email string `json:"email"`
	ID    int64  `json:"id"`
}

type githubEmail struct {
	Email    string `json:"email"`
	Primary  bool   `json:"primary"`
	Verified bool   `json:"verified"`
}

// ExchangeCode swaps the OAuth code for an access token, then loads the user
// and applies the configured authorization rules.
func (a *AuthService) ExchangeCode(ctx context.Context, code, redirectURI string) (*UserInfo, error) {
	tok, err := a.exchangeToken(ctx, code, redirectURI)
	if err != nil {
		return nil, fmt.Errorf("exchange token: %w", err)
	}
	user, err := a.fetchUser(ctx, tok)
	if err != nil {
		return nil, fmt.Errorf("fetch user: %w", err)
	}
	if user.Email == "" {
		user.Email, _ = a.fetchPrimaryEmail(ctx, tok)
	}
	if !a.authorize(ctx, tok, user) {
		return nil, errors.New("user not authorized")
	}
	return &UserInfo{
		Name:        firstNonEmpty(user.Name, user.Login),
		Email:       user.Email,
		Role:        "admin",
		GitHubLogin: user.Login,
	}, nil
}

func (a *AuthService) exchangeToken(ctx context.Context, code, redirectURI string) (string, error) {
	form := url.Values{}
	form.Set("client_id", a.cfg.GitHubClientID)
	form.Set("client_secret", a.cfg.GitHubClientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://github.com/login/oauth/access_token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var tr githubTokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return "", fmt.Errorf("parse token response: %w (body: %s)", err, truncate(string(body), 200))
	}
	if tr.Error != "" {
		return "", fmt.Errorf("github error: %s — %s", tr.Error, tr.ErrorDesc)
	}
	if tr.AccessToken == "" {
		return "", errors.New("github returned no access token")
	}
	return tr.AccessToken, nil
}

func (a *AuthService) fetchUser(ctx context.Context, token string) (*githubUser, error) {
	body, err := a.githubGET(ctx, "https://api.github.com/user", token)
	if err != nil {
		return nil, err
	}
	var u githubUser
	if err := json.Unmarshal(body, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (a *AuthService) fetchPrimaryEmail(ctx context.Context, token string) (string, error) {
	body, err := a.githubGET(ctx, "https://api.github.com/user/emails", token)
	if err != nil {
		return "", err
	}
	var emails []githubEmail
	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}
	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}
	return "", nil
}

func (a *AuthService) authorize(ctx context.Context, token string, user *githubUser) bool {
	if a.cfg.DevBypass {
		return true
	}

	allowedEmails := normalizeList(a.cfg.AllowedEmails)
	allowedLogins := normalizeList(a.cfg.AllowedGitHubLogins)
	allowedOrg := strings.TrimSpace(a.cfg.AllowedGitHubOrg)

	if a.cfg.AllowedGitHubOrg != "" {
		if a.checkOrgMembership(ctx, token, allowedOrg, user.Login) {
			return true
		}
	}

	emailLower := strings.ToLower(strings.TrimSpace(user.Email))
	loginLower := strings.ToLower(strings.TrimSpace(user.Login))

	// If no allowlists are configured at all, accept any authenticated user.
	if len(allowedEmails) == 0 && len(allowedLogins) == 0 && allowedOrg == "" {
		return true
	}
	if emailLower != "" && contains(allowedEmails, emailLower) {
		return true
	}
	if loginLower != "" && contains(allowedLogins, loginLower) {
		return true
	}
	return false
}

func (a *AuthService) checkOrgMembership(ctx context.Context, token, org, login string) bool {
	url := fmt.Sprintf("https://api.github.com/orgs/%s/members/%s", org, login)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := a.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	// 204 = member, 302 = needs different scope but indicates membership exists.
	return resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusFound
}

func (a *AuthService) githubGET(ctx context.Context, url, token string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github %s: %d — %s", url, resp.StatusCode, truncate(string(body), 200))
	}
	return io.ReadAll(resp.Body)
}

// DevAdmin returns the canned dev-admin user for bypass logins.
func (a *AuthService) DevAdmin() UserInfo {
	return UserInfo{
		Name:  "Dev Admin",
		Email: "dev-admin@example.com",
		Role:  "admin",
	}
}

// VerifyDevToken returns true if the provided token matches the configured
// dev token, or if no dev token is configured (open dev mode).
func (a *AuthService) VerifyDevToken(token string) bool {
	required := strings.TrimSpace(a.cfg.DevToken)
	if required == "" {
		return true
	}
	return strings.TrimSpace(token) == required
}

func hmacSign(secret, payload string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func normalizeList(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.ToLower(strings.TrimSpace(p))
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func contains(haystack []string, needle string) bool {
	for _, h := range haystack {
		if h == needle {
			return true
		}
	}
	return false
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
