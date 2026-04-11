package domain

import (
	"encoding/json"
	"strings"
	"time"
)

type PreservationEventType string

const (
	EventIngestion          PreservationEventType = "ingestion"
	EventValidation         PreservationEventType = "validation"
	EventMetadataExtraction PreservationEventType = "metadata_extraction"
	EventReplication        PreservationEventType = "replication"
	EventFixityCheck        PreservationEventType = "fixity_check"
	EventFormatMigration    PreservationEventType = "format_migration"
	EventDeletion           PreservationEventType = "deletion"
	EventTranscription      PreservationEventType = "transcription"
	EventEnhancement        PreservationEventType = "enhancement"
	EventNormalization      PreservationEventType = "normalization"
	EventMigration          PreservationEventType = "migration"
)

type PreservationEventOutcome string

const (
	OutcomeSuccess PreservationEventOutcome = "success"
	OutcomeFailure PreservationEventOutcome = "failure"
	OutcomeWarning PreservationEventOutcome = "warning"
)

// PreservationEvent is a PREMIS-compliant audit trail entry.
type PreservationEvent struct {
	EventType     PreservationEventType    `json:"event_type"`
	Timestamp     time.Time                `json:"timestamp"`
	Agent         string                   `json:"agent"`
	Outcome       PreservationEventOutcome `json:"outcome"`
	Detail        string                   `json:"detail,omitempty"`
	RelatedObject string                   `json:"-"`
}

// FixityInfo holds checksum data for an artifact.
// JSON serializes algorithm as a comma-joined string (frontend contract).
// BSON stores algorithm as an array.
type FixityInfo struct {
	ChecksumMD5    string     `json:"checksum_md5"`
	ChecksumSHA256 string     `json:"checksum_sha256"`
	Algorithms     []string   `json:"-"`
	CalculatedAt   time.Time  `json:"calculated_at"`
	VerifiedAt     *time.Time `json:"verified_at,omitempty"`
}

func (f FixityInfo) MarshalJSON() ([]byte, error) {
	type Alias struct {
		ChecksumMD5    string     `json:"checksum_md5"`
		ChecksumSHA256 string     `json:"checksum_sha256"`
		Algorithm      string     `json:"algorithm"`
		CalculatedAt   time.Time  `json:"calculated_at"`
		VerifiedAt     *time.Time `json:"verified_at,omitempty"`
	}
	return json.Marshal(Alias{
		ChecksumMD5:    f.ChecksumMD5,
		ChecksumSHA256: f.ChecksumSHA256,
		Algorithm:      strings.Join(f.Algorithms, ","),
		CalculatedAt:   f.CalculatedAt,
		VerifiedAt:     f.VerifiedAt,
	})
}

func (f *FixityInfo) UnmarshalJSON(data []byte) error {
	type Alias struct {
		ChecksumMD5    string     `json:"checksum_md5"`
		ChecksumSHA256 string     `json:"checksum_sha256"`
		Algorithm      string     `json:"algorithm"`
		CalculatedAt   time.Time  `json:"calculated_at"`
		VerifiedAt     *time.Time `json:"verified_at,omitempty"`
	}
	var a Alias
	if err := json.Unmarshal(data, &a); err != nil {
		return err
	}
	f.ChecksumMD5 = a.ChecksumMD5
	f.ChecksumSHA256 = a.ChecksumSHA256
	f.CalculatedAt = a.CalculatedAt
	f.VerifiedAt = a.VerifiedAt
	if a.Algorithm != "" {
		f.Algorithms = strings.Split(a.Algorithm, ",")
	}
	return nil
}
