package domain

import "time"

// IngestionMetadata is the user-submitted metadata for artifact ingestion.
// Matches the frontend contract in gng-web/lib/admin/types.ts:110-120.
type IngestionMetadata struct {
	Title        string   `json:"title"`
	Description  string   `json:"description,omitempty"`
	Creator      string   `json:"creator,omitempty"`
	CreationDate string   `json:"creation_date,omitempty"`
	Type         string   `json:"type,omitempty"`
	Format       string   `json:"format,omitempty"`
	Language     []string `json:"language,omitempty"`
	Subject      []string `json:"subject,omitempty"`
	Rights       string   `json:"rights,omitempty"`
}

// IngestionResponse is returned after artifact ingestion.
type IngestionResponse struct {
	ArtifactID string         `json:"artifact_id"`
	Status     ArtifactStatus `json:"status"`
	Message    string         `json:"message,omitempty"`
	UploadPath string         `json:"upload_path,omitempty"`
}

// UploadURLRequest is the request body for presigned URL generation (Path B).
type UploadURLRequest struct {
	Metadata    IngestionMetadata `json:"metadata"`
	Filename    string            `json:"filename"`
	ContentType string            `json:"content_type"`
	SizeBytes   int64             `json:"size_bytes"`
}

// UploadURLResponse is returned with a presigned PUT URL for direct-to-storage uploads.
type UploadURLResponse struct {
	ArtifactID string    `json:"artifact_id"`
	UploadURL  string    `json:"upload_url"`
	ExpiresAt  time.Time `json:"expires_at"`
}
