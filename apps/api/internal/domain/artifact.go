package domain

import "time"

type ArtifactStatus string

const (
	ArtifactStatusUploading  ArtifactStatus = "uploading"
	ArtifactStatusProcessing ArtifactStatus = "processing"
	ArtifactStatusReady      ArtifactStatus = "ready"
	ArtifactStatusFailed     ArtifactStatus = "failed"
	ArtifactStatusArchived   ArtifactStatus = "archived"
)

// Artifact is the core domain object representing a preserved digital artifact.
// JSON tags match the frontend contract in gng-web/lib/admin/types.ts.
type Artifact struct {
	ArtifactID         string              `json:"artifact_id"`
	Title              string              `json:"title"`
	Description        string              `json:"description,omitempty"`
	Creator            string              `json:"creator,omitempty"`
	CreationDate       string              `json:"creation_date,omitempty"`
	Type               string              `json:"type,omitempty"`
	Format             string              `json:"format,omitempty"`
	Language           []string            `json:"language,omitempty"`
	Subject            []string            `json:"subject,omitempty"`
	Rights             string              `json:"rights,omitempty"`
	Status             ArtifactStatus      `json:"status"`
	OriginalFilename   string              `json:"original_filename"`
	FileExtension      string              `json:"file_extension"`
	MIMEType           string              `json:"mime_type,omitempty"`
	SizeBytes          *int64              `json:"size_bytes,omitempty"`
	UploadedAt         *time.Time          `json:"uploaded_at,omitempty"`
	StorageLocations   []StorageLocation   `json:"storage_locations,omitempty"`
	PreservationEvents []PreservationEvent `json:"preservation_events,omitempty"`
	Fixity             *FixityInfo         `json:"fixity,omitempty"`
	ProcessingMetadata map[string]any      `json:"processing_metadata,omitempty"`
	HotStorageRetained *bool               `json:"hot_storage_retained,omitempty"`

	// Internal fields — not serialized to JSON responses.
	Version   int       `json:"-"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
}

// ArtifactListItem is the reduced projection used for list endpoints.
type ArtifactListItem struct {
	ArtifactID string         `json:"artifact_id"`
	Title      string         `json:"title"`
	Status     ArtifactStatus `json:"status"`
	Type       string         `json:"type,omitempty"`
	SizeBytes  *int64         `json:"size_bytes,omitempty"`
	UploadedAt *time.Time     `json:"uploaded_at,omitempty"`
}

// ArtifactListResponse is the response envelope for listing artifacts.
type ArtifactListResponse struct {
	Artifacts []ArtifactListItem `json:"artifacts"`
	Total     int                `json:"total"`
}

// ArtifactStatusResponse is returned by the status polling endpoint.
type ArtifactStatusResponse struct {
	ArtifactID string         `json:"artifact_id"`
	Status     ArtifactStatus `json:"status"`
	Detail     string         `json:"detail,omitempty"`
	UpdatedAt  *time.Time     `json:"updated_at,omitempty"`
}
