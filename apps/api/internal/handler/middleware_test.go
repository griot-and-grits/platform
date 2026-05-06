package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSMiddleware(t *testing.T) {
	cases := []struct {
		name             string
		allowed          []string
		requestOrigin    string
		wantAllowOrigin  string
		wantCredentials  string
	}{
		{
			name:            "exact match echoes origin",
			allowed:         []string{"https://www.griotandgrits.org"},
			requestOrigin:   "https://www.griotandgrits.org",
			wantAllowOrigin: "https://www.griotandgrits.org",
			wantCredentials: "true",
		},
		{
			name:            "no match -> no headers",
			allowed:         []string{"https://www.griotandgrits.org"},
			requestOrigin:   "https://evil.example.com",
			wantAllowOrigin: "",
			wantCredentials: "",
		},
		{
			name:            "wildcard reflects request origin (so credentials work)",
			allowed:         []string{"*"},
			requestOrigin:   "http://localhost:3000",
			wantAllowOrigin: "http://localhost:3000",
			wantCredentials: "true",
		},
		{
			name:            "empty origin -> no headers",
			allowed:         []string{"*"},
			requestOrigin:   "",
			wantAllowOrigin: "",
			wantCredentials: "",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			handler := CORSMiddleware(tc.allowed)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest(http.MethodGet, "/anything", nil)
			if tc.requestOrigin != "" {
				req.Header.Set("Origin", tc.requestOrigin)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tc.wantAllowOrigin {
				t.Errorf("Allow-Origin: got %q, want %q", got, tc.wantAllowOrigin)
			}
			if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != tc.wantCredentials {
				t.Errorf("Allow-Credentials: got %q, want %q", got, tc.wantCredentials)
			}
		})
	}
}

func TestCORSMiddlewareOPTIONS(t *testing.T) {
	called := false
	handler := CORSMiddleware([]string{"https://example.com"})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	}))

	req := httptest.NewRequest(http.MethodOptions, "/anything", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if called {
		t.Error("OPTIONS preflight should not call downstream handler")
	}
	if rec.Code != http.StatusNoContent {
		t.Errorf("status: got %d, want 204", rec.Code)
	}
}
