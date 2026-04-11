package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/service"
)

type PipelineCallbackHandler struct {
	pipelineHandler *service.PipelineHandlerService
	callbackSecret  string
}

func NewPipelineCallbackHandler(pipelineHandler *service.PipelineHandlerService, callbackSecret string) *PipelineCallbackHandler {
	return &PipelineCallbackHandler{
		pipelineHandler: pipelineHandler,
		callbackSecret:  callbackSecret,
	}
}

func (h *PipelineCallbackHandler) HandleCallback(w http.ResponseWriter, r *http.Request) {
	// Verify shared secret.
	auth := r.Header.Get("Authorization")
	token := strings.TrimPrefix(auth, "Bearer ")
	if token == "" || token != h.callbackSecret {
		writeError(w, http.StatusUnauthorized, "Invalid or missing callback secret")
		return
	}

	var cb domain.PipelineCallback
	if err := json.NewDecoder(r.Body).Decode(&cb); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid callback payload: "+err.Error())
		return
	}

	if cb.ArtifactID == "" || cb.Task == "" {
		writeError(w, http.StatusBadRequest, "artifact_id and task are required")
		return
	}

	if err := h.pipelineHandler.HandleCallback(r.Context(), cb); err != nil {
		writeError(w, http.StatusInternalServerError, "Callback processing failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
