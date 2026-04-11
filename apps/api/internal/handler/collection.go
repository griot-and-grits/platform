package handler

import "net/http"

// CollectionHandler stubs collection endpoints until Phase 4.
type CollectionHandler struct{}

func NewCollectionHandler() *CollectionHandler {
	return &CollectionHandler{}
}

func (h *CollectionHandler) CreateDraft(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusServiceUnavailable, "Collection service not available — requires Globus configuration")
}

func (h *CollectionHandler) Finalize(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusServiceUnavailable, "Collection service not available — requires Globus configuration")
}

func (h *CollectionHandler) GetCollection(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusServiceUnavailable, "Collection service not available — requires Globus configuration")
}

func (h *CollectionHandler) ListCollections(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusServiceUnavailable, "Collection service not available — requires Globus configuration")
}
