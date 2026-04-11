package service

import (
	"context"
	"fmt"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
)

// StorageLocationService manages artifact storage location tracking.
type StorageLocationService struct {
	repo port.ArtifactRepo
}

func NewStorageLocationService(repo port.ArtifactRepo) *StorageLocationService {
	return &StorageLocationService{repo: repo}
}

// RegisterLocation records a new storage location for an artifact.
func (s *StorageLocationService) RegisterLocation(ctx context.Context, artifactID string, loc domain.StorageLocation) error {
	if loc.StoredAt.IsZero() {
		loc.StoredAt = time.Now().UTC()
	}
	return s.repo.AddStorageLocation(ctx, artifactID, loc)
}

// GetLocations returns all storage locations for an artifact.
func (s *StorageLocationService) GetLocations(ctx context.Context, artifactID string) ([]domain.StorageLocation, error) {
	artifact, err := s.repo.FindByID(ctx, artifactID)
	if err != nil {
		return nil, err
	}
	if artifact == nil {
		return nil, fmt.Errorf("artifact not found: %s", artifactID)
	}
	locations := artifact.StorageLocations
	if locations == nil {
		locations = []domain.StorageLocation{}
	}
	return locations, nil
}

// BuildStoragePath generates the storage path for an artifact file.
// Format: artifacts/YYYY/MM/{artifactID}/{filename}
func (s *StorageLocationService) BuildStoragePath(artifactID, filename string, storageType domain.StorageType) string {
	now := time.Now().UTC()
	prefix := "artifacts"
	if storageType == domain.StorageTypeArchive {
		prefix = "archive"
	}
	return fmt.Sprintf("%s/%d/%02d/%s/%s", prefix, now.Year(), now.Month(), artifactID, filename)
}
