package service

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"strings"
	"testing"
)

func TestTeeReaderChecksums(t *testing.T) {
	data := "hello world test data for checksum verification"

	// Direct calculation for comparison.
	md5Direct := md5.Sum([]byte(data))
	sha256Direct := sha256.Sum256([]byte(data))
	expectedMD5 := hex.EncodeToString(md5Direct[:])
	expectedSHA256 := hex.EncodeToString(sha256Direct[:])

	svc := NewFixityService()
	reader := strings.NewReader(data)
	tee, acc := svc.NewTeeReader(reader)

	result, err := io.ReadAll(tee)
	if err != nil {
		t.Fatalf("ReadAll: %v", err)
	}

	if string(result) != data {
		t.Errorf("data mismatch: got %q, want %q", string(result), data)
	}
	if acc.MD5() != expectedMD5 {
		t.Errorf("MD5 mismatch: got %s, want %s", acc.MD5(), expectedMD5)
	}
	if acc.SHA256() != expectedSHA256 {
		t.Errorf("SHA256 mismatch: got %s, want %s", acc.SHA256(), expectedSHA256)
	}
	if acc.Size() != int64(len(data)) {
		t.Errorf("size mismatch: got %d, want %d", acc.Size(), len(data))
	}
}

func TestCalculateChecksums(t *testing.T) {
	data := "test"
	svc := NewFixityService()

	md5sum, sha256sum, size, err := svc.CalculateChecksums(strings.NewReader(data))
	if err != nil {
		t.Fatalf("CalculateChecksums: %v", err)
	}

	if size != int64(len(data)) {
		t.Errorf("size: got %d, want %d", size, len(data))
	}
	if md5sum == "" || sha256sum == "" {
		t.Error("checksums should not be empty")
	}
}

func TestGenerateFixityInfo(t *testing.T) {
	svc := NewFixityService()
	info := svc.GenerateFixityInfo("abc123", "def456")

	if info.ChecksumMD5 != "abc123" {
		t.Errorf("MD5: got %s", info.ChecksumMD5)
	}
	if info.ChecksumSHA256 != "def456" {
		t.Errorf("SHA256: got %s", info.ChecksumSHA256)
	}
	if len(info.Algorithms) != 2 {
		t.Errorf("algorithms: got %v", info.Algorithms)
	}
	if info.CalculatedAt.IsZero() {
		t.Error("CalculatedAt should not be zero")
	}
}
