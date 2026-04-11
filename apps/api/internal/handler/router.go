package handler

import (
	"log/slog"
	"net/http"
)

// NewRouter wires all routes and middleware.
func NewRouter(
	artifact *ArtifactHandler,
	preservation *PreservationHandler,
	collection *CollectionHandler,
	health *HealthHandler,
	pipelineCallback *PipelineCallbackHandler,
	corsOrigins []string,
	logger *slog.Logger,
) http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("GET /health", health.Check)

	// Artifacts
	mux.HandleFunc("POST /artifacts/ingest", artifact.Ingest)
	mux.HandleFunc("POST /artifacts/upload-url", artifact.RequestUploadURL)
	mux.HandleFunc("POST /artifacts/{id}/confirm-upload", artifact.ConfirmUpload)
	mux.HandleFunc("GET /artifacts/{id}/status", artifact.GetArtifactStatus)
	mux.HandleFunc("GET /artifacts/{id}", artifact.GetArtifact)
	mux.HandleFunc("GET /artifacts", artifact.ListArtifacts)

	// Collections (Phase 4 stubs)
	mux.HandleFunc("POST /collections/draft", collection.CreateDraft)
	mux.HandleFunc("POST /collections/{id}/finalize", collection.Finalize)
	mux.HandleFunc("GET /collections/{id}", collection.GetCollection)
	mux.HandleFunc("GET /collections", collection.ListCollections)

	// Preservation
	mux.HandleFunc("GET /preservation/artifacts/{id}/events", preservation.GetEvents)
	mux.HandleFunc("GET /preservation/artifacts/{id}/storage-locations", preservation.GetStorageLocations)
	mux.HandleFunc("GET /preservation/artifacts/{id}/fixity", preservation.GetFixity)
	mux.HandleFunc("POST /preservation/artifacts/{id}/replicate", preservation.Replicate)

	// Pipeline (internal)
	mux.HandleFunc("POST /internal/pipeline/callback", pipelineCallback.HandleCallback)

	// Apply middleware: CORS → Request ID → Logging → Router
	var handler http.Handler = mux
	handler = LoggingMiddleware(logger)(handler)
	handler = RequestIDMiddleware(handler)
	handler = CORSMiddleware(corsOrigins)(handler)

	return handler
}
