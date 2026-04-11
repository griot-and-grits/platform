package port

import (
	"context"
	"io"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
)

// ObjectStore abstracts object storage operations (MinIO/S3).
type ObjectStore interface {
	Upload(ctx context.Context, bucket, path string, reader io.Reader, size int64, contentType string, metadata map[string]string) error
	Download(ctx context.Context, bucket, path string) (io.ReadCloser, error)
	Delete(ctx context.Context, bucket, path string) error
	Exists(ctx context.Context, bucket, path string) (bool, error)
	PresignPutURL(ctx context.Context, bucket, path, contentType string, expiry time.Duration) (string, error)
	StatObject(ctx context.Context, bucket, path string) (domain.ObjectInfo, error)
}
