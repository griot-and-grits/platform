package domain

import "time"

type StorageType string

const (
	StorageTypeHot     StorageType = "hot"
	StorageTypeArchive StorageType = "archive"
)

// StorageLocation tracks where an artifact is stored.
// JSON: "stored_at" matches the frontend contract.
// BSON: "created_at" matches existing MongoDB documents from the Python backend.
type StorageLocation struct {
	StorageType    StorageType `json:"storage_type"`
	Path           string      `json:"path"`
	Bucket         string      `json:"-"`
	Endpoint       string      `json:"-"`
	ChecksumMD5    string      `json:"checksum_md5"`
	ChecksumSHA256 string      `json:"checksum_sha256"`
	SizeBytes      int64       `json:"size_bytes"`
	StoredAt       time.Time   `json:"stored_at"`
	VerifiedAt     *time.Time  `json:"verified_at,omitempty"`
}

// ObjectInfo holds metadata returned by StatObject on the object store.
type ObjectInfo struct {
	Size        int64
	ETag        string
	ContentType string
}
