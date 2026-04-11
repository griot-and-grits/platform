package service

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"hash"
	"io"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
)

// FixityService provides checksum calculation for artifact integrity.
type FixityService struct{}

func NewFixityService() *FixityService {
	return &FixityService{}
}

// ChecksumAccumulator calculates MD5 and SHA-256 simultaneously while data flows through.
type ChecksumAccumulator struct {
	md5Hash    hash.Hash
	sha256Hash hash.Hash
	writer     io.Writer
	size       int64
}

// NewTeeReader wraps a reader so that data flows through checksum hashes as it is read.
// The caller reads from the returned reader (e.g., to upload to MinIO).
// After all data is consumed, call accumulator methods to get the results.
func (s *FixityService) NewTeeReader(reader io.Reader) (io.Reader, *ChecksumAccumulator) {
	acc := &ChecksumAccumulator{
		md5Hash:    md5.New(),
		sha256Hash: sha256.New(),
	}
	acc.writer = io.MultiWriter(acc.md5Hash, acc.sha256Hash)

	counting := &countingReader{reader: reader, acc: acc}
	tee := io.TeeReader(counting, acc.writer)
	return tee, acc
}

// CalculateChecksums reads the entire reader and returns checksums + bytes read.
func (s *FixityService) CalculateChecksums(reader io.Reader) (md5sum, sha256sum string, bytesRead int64, err error) {
	tee, acc := s.NewTeeReader(reader)
	if _, err = io.Copy(io.Discard, tee); err != nil {
		return "", "", 0, err
	}
	return acc.MD5(), acc.SHA256(), acc.Size(), nil
}

// GenerateFixityInfo creates a FixityInfo from checksum strings.
func (s *FixityService) GenerateFixityInfo(md5sum, sha256sum string) domain.FixityInfo {
	return domain.FixityInfo{
		ChecksumMD5:    md5sum,
		ChecksumSHA256: sha256sum,
		Algorithms:     []string{"md5", "sha256"},
		CalculatedAt:   time.Now().UTC(),
	}
}

// VerifyChecksums compares expected vs actual checksums.
func (s *FixityService) VerifyChecksums(expected, actual domain.FixityInfo) (bool, []string) {
	var mismatches []string
	if expected.ChecksumMD5 != actual.ChecksumMD5 {
		mismatches = append(mismatches, "md5 mismatch")
	}
	if expected.ChecksumSHA256 != actual.ChecksumSHA256 {
		mismatches = append(mismatches, "sha256 mismatch")
	}
	return len(mismatches) == 0, mismatches
}

func (a *ChecksumAccumulator) MD5() string {
	return hex.EncodeToString(a.md5Hash.Sum(nil))
}

func (a *ChecksumAccumulator) SHA256() string {
	return hex.EncodeToString(a.sha256Hash.Sum(nil))
}

func (a *ChecksumAccumulator) Size() int64 {
	return a.size
}

// countingReader wraps a reader to count bytes read.
type countingReader struct {
	reader io.Reader
	acc    *ChecksumAccumulator
}

func (r *countingReader) Read(p []byte) (int, error) {
	n, err := r.reader.Read(p)
	r.acc.size += int64(n)
	return n, err
}
