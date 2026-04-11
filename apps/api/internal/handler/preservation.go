package handler

import (
	"net/http"

	"github.com/griotandgrits/platform/apps/api/internal/service"
)

type PreservationHandler struct {
	preservation *service.PreservationService
}

func NewPreservationHandler(preservation *service.PreservationService) *PreservationHandler {
	return &PreservationHandler{preservation: preservation}
}

func (h *PreservationHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	events, err := h.preservation.GetEvents(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get events: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"artifact_id": id,
		"events":      events,
	})
}

// GetStorageLocations returns storage locations.
// Uses "storage_locations" key to match the frontend contract (fixes Python bug that used "locations").
func (h *PreservationHandler) GetStorageLocations(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	locations, err := h.preservation.GetStorageLocations(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get storage locations: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"artifact_id":       id,
		"storage_locations": locations,
		"total_copies":      len(locations),
	})
}

func (h *PreservationHandler) GetFixity(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	fixity, err := h.preservation.GetFixity(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to get fixity: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"artifact_id": id,
		"fixity":      fixity,
	})
}

func (h *PreservationHandler) Replicate(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "Replication not yet implemented")
}
