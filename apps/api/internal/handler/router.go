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
	auth *AuthHandler,
	integrations *IntegrationsHandler,
	corsOrigins []string,
	logger *slog.Logger,
) http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("GET /health", health.Check)

	// Auth
	mux.HandleFunc("GET /auth/github", auth.StartLogin)
	mux.HandleFunc("POST /auth/github", auth.DevLogin)
	mux.HandleFunc("GET /auth/github/callback", auth.OAuthCallback)
	mux.HandleFunc("GET /auth/session", auth.GetSession)
	mux.HandleFunc("GET /auth/logout", auth.Logout)
	mux.HandleFunc("POST /auth/logout", auth.Logout)

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

	// Public integrations (proxy to Mailchimp / Classy)
	mux.HandleFunc("POST /integrations/subscribe", integrations.Subscribe)
	mux.HandleFunc("GET /integrations/gofundme/public", integrations.GoFundMePublic)
	mux.HandleFunc("GET /integrations/gofundme/campaign", integrations.GoFundMeCampaign)

	// Pipeline (internal)
	mux.HandleFunc("POST /internal/pipeline/callback", pipelineCallback.HandleCallback)

	// Apply middleware: CORS → Request ID → Logging → Router
	var handler http.Handler = mux
	handler = LoggingMiddleware(logger)(handler)
	handler = RequestIDMiddleware(handler)
	handler = CORSMiddleware(corsOrigins)(handler)

	return handler
}
