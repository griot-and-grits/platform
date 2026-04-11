package domain

import "time"

type CollectionStatus string

const (
	CollectionDraft            CollectionStatus = "draft"
	CollectionAwaitingUpload   CollectionStatus = "awaiting_upload"
	CollectionUploadInProgress CollectionStatus = "upload_in_progress"
	CollectionVerifying        CollectionStatus = "verifying"
	CollectionSealed           CollectionStatus = "sealed"
	CollectionError            CollectionStatus = "error"
)

type Collection struct {
	CollectionID     string           `json:"collection_id"`
	Title            string           `json:"title"`
	Description      string           `json:"description,omitempty"`
	Slug             string           `json:"slug"`
	Status           CollectionStatus `json:"status"`
	CreatedAt        time.Time        `json:"created_at"`
	SealedAt         *time.Time       `json:"sealed_at,omitempty"`
	ArtifactIDs      []string         `json:"artifact_ids,omitempty"`
	Verification     *Verification    `json:"verification,omitempty"`
	UploadPath       string           `json:"upload_path,omitempty"`
	GlobusEndpointID string           `json:"globus_endpoint_id,omitempty"`
}

type Verification struct {
	Status      string     `json:"status"`
	Detail      string     `json:"detail,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

type CollectionDraftRequest struct {
	Title                  string   `json:"title"`
	Description            string   `json:"description,omitempty"`
	Slug                   string   `json:"slug,omitempty"`
	ExpectedArtifactCount  *int     `json:"expected_artifact_count,omitempty"`
	Tags                   []string `json:"tags,omitempty"`
}

type CollectionDraftResponse struct {
	CollectionID     string           `json:"collection_id"`
	UploadPath       string           `json:"upload_path"`
	RawUploadPath    string           `json:"raw_upload_path"`
	GlobusEndpointID string           `json:"globus_endpoint_id"`
	GlobusLink       string           `json:"globus_link"`
	Status           CollectionStatus `json:"status"`
	CreatedAt        time.Time        `json:"created_at"`
}

type CollectionListResponse struct {
	Collections []Collection `json:"collections"`
	Count       int          `json:"count"`
	Total       int          `json:"total"`
}
