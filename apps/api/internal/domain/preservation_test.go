package domain

import (
	"encoding/json"
	"testing"
	"time"
)

func TestFixityInfoMarshalJSON(t *testing.T) {
	now := time.Date(2025, 4, 10, 12, 0, 0, 0, time.UTC)
	info := FixityInfo{
		ChecksumMD5:    "abc123",
		ChecksumSHA256: "def456",
		Algorithms:     []string{"md5", "sha256"},
		CalculatedAt:   now,
	}

	data, err := json.Marshal(info)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}

	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	// Frontend expects "algorithm" as a string, not an array.
	alg, ok := m["algorithm"].(string)
	if !ok {
		t.Fatalf("algorithm should be a string, got %T: %v", m["algorithm"], m["algorithm"])
	}
	if alg != "md5,sha256" {
		t.Errorf("algorithm: got %q, want %q", alg, "md5,sha256")
	}

	if m["checksum_md5"] != "abc123" {
		t.Errorf("checksum_md5: got %v", m["checksum_md5"])
	}
	if m["checksum_sha256"] != "def456" {
		t.Errorf("checksum_sha256: got %v", m["checksum_sha256"])
	}
}

func TestFixityInfoUnmarshalJSON(t *testing.T) {
	data := `{"checksum_md5":"abc","checksum_sha256":"def","algorithm":"md5,sha256","calculated_at":"2025-04-10T12:00:00Z"}`

	var info FixityInfo
	if err := json.Unmarshal([]byte(data), &info); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}

	if len(info.Algorithms) != 2 || info.Algorithms[0] != "md5" || info.Algorithms[1] != "sha256" {
		t.Errorf("algorithms: got %v", info.Algorithms)
	}
	if info.ChecksumMD5 != "abc" {
		t.Errorf("checksum_md5: got %s", info.ChecksumMD5)
	}
}
