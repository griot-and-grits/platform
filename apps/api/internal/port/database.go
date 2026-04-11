package port

import (
	"context"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
)

// ArtifactFilter defines query parameters for listing artifacts.
type ArtifactFilter struct {
	Status *domain.ArtifactStatus
	Type   string
	Limit  int
	Skip   int
}

// ArtifactRepo abstracts artifact persistence.
type ArtifactRepo interface {
	Insert(ctx context.Context, artifact *domain.Artifact) (string, error)
	FindByID(ctx context.Context, id string) (*domain.Artifact, error)
	List(ctx context.Context, filter ArtifactFilter) ([]domain.ArtifactListItem, int, error)
	UpdateStatus(ctx context.Context, id string, status domain.ArtifactStatus) error
	AddStorageLocation(ctx context.Context, id string, loc domain.StorageLocation) error
	AddPreservationEvent(ctx context.Context, id string, event domain.PreservationEvent) error
	UpdateFields(ctx context.Context, id string, fields map[string]any) error
}

// CollectionFilter defines query parameters for listing collections.
type CollectionFilter struct {
	Status *domain.CollectionStatus
	Limit  int
	Skip   int
}

// CollectionRepo abstracts collection persistence.
type CollectionRepo interface {
	Insert(ctx context.Context, collection *domain.Collection) (string, error)
	FindByID(ctx context.Context, collectionID string) (*domain.Collection, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Collection, error)
	List(ctx context.Context, filter CollectionFilter) ([]domain.Collection, int, error)
	Update(ctx context.Context, collectionID string, fields map[string]any) error
}
