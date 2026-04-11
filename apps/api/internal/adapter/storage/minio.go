package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/config"
	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinIOStore implements port.ObjectStore using MinIO.
type MinIOStore struct {
	client *minio.Client
}

// NewMinIOStore creates a new MinIO client.
func NewMinIOStore(cfg config.StorageConfig) (*MinIOStore, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.Secure,
		Region: cfg.Region,
	})
	if err != nil {
		return nil, fmt.Errorf("minio client: %w", err)
	}
	return &MinIOStore{client: client}, nil
}

func (s *MinIOStore) Upload(ctx context.Context, bucket, path string, reader io.Reader, size int64, contentType string, metadata map[string]string) error {
	opts := minio.PutObjectOptions{
		ContentType:  contentType,
		UserMetadata: metadata,
	}
	_, err := s.client.PutObject(ctx, bucket, path, reader, size, opts)
	if err != nil {
		return fmt.Errorf("minio upload %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *MinIOStore) Download(ctx context.Context, bucket, path string) (io.ReadCloser, error) {
	obj, err := s.client.GetObject(ctx, bucket, path, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("minio download %s/%s: %w", bucket, path, err)
	}
	return obj, nil
}

func (s *MinIOStore) Delete(ctx context.Context, bucket, path string) error {
	err := s.client.RemoveObject(ctx, bucket, path, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("minio delete %s/%s: %w", bucket, path, err)
	}
	return nil
}

func (s *MinIOStore) Exists(ctx context.Context, bucket, path string) (bool, error) {
	_, err := s.client.StatObject(ctx, bucket, path, minio.StatObjectOptions{})
	if err != nil {
		resp := minio.ToErrorResponse(err)
		if resp.Code == "NoSuchKey" {
			return false, nil
		}
		return false, fmt.Errorf("minio stat %s/%s: %w", bucket, path, err)
	}
	return true, nil
}

func (s *MinIOStore) PresignPutURL(ctx context.Context, bucket, path, contentType string, expiry time.Duration) (string, error) {
	reqParams := make(url.Values)
	if contentType != "" {
		reqParams.Set("Content-Type", contentType)
	}
	u, err := s.client.PresignedPutObject(ctx, bucket, path, expiry)
	if err != nil {
		return "", fmt.Errorf("minio presign put %s/%s: %w", bucket, path, err)
	}
	return u.String(), nil
}

func (s *MinIOStore) StatObject(ctx context.Context, bucket, path string) (domain.ObjectInfo, error) {
	info, err := s.client.StatObject(ctx, bucket, path, minio.StatObjectOptions{})
	if err != nil {
		return domain.ObjectInfo{}, fmt.Errorf("minio stat %s/%s: %w", bucket, path, err)
	}
	return domain.ObjectInfo{
		Size:        info.Size,
		ETag:        info.ETag,
		ContentType: info.ContentType,
	}, nil
}
