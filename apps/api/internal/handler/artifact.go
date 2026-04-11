package handler

import (
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
	"github.com/griotandgrits/platform/apps/api/internal/service"
)

type ArtifactHandler struct {
	ingestion *service.IngestionService
	repo      port.ArtifactRepo
}

func NewArtifactHandler(ingestion *service.IngestionService, repo port.ArtifactRepo) *ArtifactHandler {
	return &ArtifactHandler{ingestion: ingestion, repo: repo}
}

// Ingest handles Path A: streaming multipart upload.
// Uses r.MultipartReader() to stream the file body without buffering to memory/disk.
func (h *ArtifactHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	ct := r.Header.Get("Content-Type")
	mediaType, params, err := mime.ParseMediaType(ct)
	if err != nil || !strings.HasPrefix(mediaType, "multipart/") {
		writeError(w, http.StatusBadRequest, "Content-Type must be multipart/form-data")
		return
	}

	reader := multipart.NewReader(r.Body, params["boundary"])
	var metadata domain.IngestionMetadata
	var fileReader io.Reader
	var filename, contentType string
	metadataFound := false

	// Iterate parts: metadata first, then file.
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			writeError(w, http.StatusBadRequest, "Failed to read multipart form")
			return
		}

		switch part.FormName() {
		case "metadata":
			if err := json.NewDecoder(part).Decode(&metadata); err != nil {
				writeError(w, http.StatusBadRequest, "Invalid metadata JSON: "+err.Error())
				return
			}
			metadataFound = true
		case "file":
			filename = part.FileName()
			contentType = part.Header.Get("Content-Type")
			if contentType == "" {
				contentType = "application/octet-stream"
			}
			fileReader = part
		}

		// Stream file part directly — don't close it yet.
		if metadataFound && fileReader != nil {
			break
		}
	}

	if !metadataFound {
		writeError(w, http.StatusBadRequest, "Missing metadata field")
		return
	}
	if fileReader == nil {
		writeError(w, http.StatusBadRequest, "Missing file field")
		return
	}
	if metadata.Title == "" {
		writeError(w, http.StatusBadRequest, "Title is required")
		return
	}

	resp, err := h.ingestion.Ingest(r.Context(), fileReader, filename, contentType, metadata)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ingestion failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

// RequestUploadURL handles Path B step 1: presigned URL for large files.
func (h *ArtifactHandler) RequestUploadURL(w http.ResponseWriter, r *http.Request) {
	var req domain.UploadURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}
	if req.Metadata.Title == "" {
		writeError(w, http.StatusBadRequest, "Title is required")
		return
	}
	if req.Filename == "" {
		writeError(w, http.StatusBadRequest, "Filename is required")
		return
	}

	resp, err := h.ingestion.RequestUploadURL(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate upload URL: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

// ConfirmUpload handles Path B step 2: verify presigned upload completed.
func (h *ArtifactHandler) ConfirmUpload(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	resp, err := h.ingestion.ConfirmUpload(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Confirm upload failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetArtifact returns a single artifact by ID.
func (h *ArtifactHandler) GetArtifact(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	artifact, err := h.repo.FindByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve artifact: "+err.Error())
		return
	}
	if artifact == nil {
		writeError(w, http.StatusNotFound, "Artifact not found")
		return
	}

	writeJSON(w, http.StatusOK, artifact)
}

// GetArtifactStatus returns the processing status of an artifact.
func (h *ArtifactHandler) GetArtifactStatus(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "Artifact ID is required")
		return
	}

	artifact, err := h.repo.FindByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve artifact: "+err.Error())
		return
	}
	if artifact == nil {
		writeError(w, http.StatusNotFound, "Artifact not found")
		return
	}

	resp := domain.ArtifactStatusResponse{
		ArtifactID: artifact.ArtifactID,
		Status:     artifact.Status,
		UpdatedAt:  &artifact.UpdatedAt,
	}
	if artifact.Status == domain.ArtifactStatusFailed {
		resp.Detail = "Processing failed"
	}

	writeJSON(w, http.StatusOK, resp)
}

// ListArtifacts returns paginated artifacts with optional filters.
func (h *ArtifactHandler) ListArtifacts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	filter := port.ArtifactFilter{
		Limit: 50,
		Skip:  0,
	}

	if v := q.Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 100 {
			filter.Limit = n
		}
	}
	if v := q.Get("skip"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			filter.Skip = n
		}
	}
	if v := q.Get("status"); v != "" {
		s := domain.ArtifactStatus(v)
		filter.Status = &s
	}
	if v := q.Get("type"); v != "" {
		filter.Type = v
	}

	items, total, err := h.repo.List(r.Context(), filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list artifacts: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, domain.ArtifactListResponse{
		Artifacts: items,
		Total:     total,
	})
}
