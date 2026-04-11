package handler

import (
	"net/http"

	"github.com/griotandgrits/platform/apps/api/internal/config"
)

type HealthHandler struct {
	cfg *config.Config
}

func NewHealthHandler(cfg *config.Config) *HealthHandler {
	return &HealthHandler{cfg: cfg}
}

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":      "healthy",
		"environment": h.cfg.Environment,
	})
}
