package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/griotandgrits/platform/apps/api/internal/service"
)

type IntegrationsHandler struct {
	svc    *service.IntegrationsService
	logger *slog.Logger
}

func NewIntegrationsHandler(svc *service.IntegrationsService, logger *slog.Logger) *IntegrationsHandler {
	return &IntegrationsHandler{svc: svc, logger: logger}
}

type subscribeRequest struct {
	Email string `json:"email"`
	Type  string `json:"type"`
}

// Subscribe handles POST /integrations/subscribe (Mailchimp newsletter signup).
func (h *IntegrationsHandler) Subscribe(w http.ResponseWriter, r *http.Request) {
	var req subscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if strings.TrimSpace(req.Email) == "" {
		writeError(w, http.StatusBadRequest, "Email is required!")
		return
	}

	err := h.svc.Subscribe(r.Context(), req.Email, req.Type)
	if err == nil {
		writeJSON(w, http.StatusOK, map[string]string{"status": "subscribed"})
		return
	}

	if errors.Is(err, service.ErrMailchimpNotConfigured) {
		writeError(w, http.StatusServiceUnavailable, "Newsletter signup is not configured")
		return
	}
	var subErr *service.SubscribeError
	if errors.As(err, &subErr) {
		writeError(w, subErr.Status, subErr.Message)
		return
	}
	h.logger.Error("subscribe", "error", err)
	writeError(w, http.StatusBadGateway, "Failed to reach newsletter provider")
}

// GoFundMePublic handles GET /integrations/gofundme/public (public campaign data).
func (h *IntegrationsHandler) GoFundMePublic(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	id := q.Get("id")
	urlParam := q.Get("url")
	if id == "" && urlParam == "" {
		writeError(w, http.StatusBadRequest, "Campaign URL or ID is required")
		return
	}

	campaign, err := h.svc.PublicCampaignByID(r.Context(), id, urlParam)
	if err != nil {
		if errors.Is(err, service.ErrGoFundMeNotConfigured) {
			writeError(w, http.StatusServiceUnavailable, "GoFundMe integration not configured")
			return
		}
		h.logger.Warn("gofundme public", "error", err, "campaign_id", id)
		writeError(w, http.StatusNotFound, "Unable to fetch campaign data from GoFundMe APIs. Please check the campaign ID and ensure it is public.")
		return
	}
	writeJSON(w, http.StatusOK, campaign)
}

// GoFundMeCampaign handles GET /integrations/gofundme/campaign — proxies to
// Classy using a caller-supplied bearer token.
func (h *IntegrationsHandler) GoFundMeCampaign(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Campaign ID is required")
		return
	}
	auth := r.Header.Get("Authorization")
	token := strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	if token == "" {
		writeError(w, http.StatusUnauthorized, "Access token is required")
		return
	}

	payload, status, err := h.svc.AuthenticatedCampaignByID(r.Context(), id, token)
	if err != nil {
		switch status {
		case http.StatusUnauthorized:
			writeError(w, status, "Invalid or expired access token")
		case http.StatusNotFound:
			writeError(w, status, "Campaign not found")
		default:
			h.logger.Warn("gofundme campaign", "error", err, "campaign_id", id)
			writeError(w, status, "Failed to fetch campaign data")
		}
		return
	}
	writeJSON(w, http.StatusOK, payload)
}
