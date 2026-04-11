package service

import (
	"context"
	"fmt"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
)

// PreservationService manages PREMIS-compliant preservation events and fixity data.
type PreservationService struct {
	repo port.ArtifactRepo
}

func NewPreservationService(repo port.ArtifactRepo) *PreservationService {
	return &PreservationService{repo: repo}
}

func (s *PreservationService) LogEvent(ctx context.Context, artifactID string, event domain.PreservationEvent) error {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}
	return s.repo.AddPreservationEvent(ctx, artifactID, event)
}

func (s *PreservationService) LogIngestion(ctx context.Context, artifactID string, outcome domain.PreservationEventOutcome, storagePath, agent string) error {
	return s.LogEvent(ctx, artifactID, domain.PreservationEvent{
		EventType:     domain.EventIngestion,
		Timestamp:     time.Now().UTC(),
		Agent:         agent,
		Outcome:       outcome,
		Detail:        fmt.Sprintf("Artifact ingested to storage path: %s", storagePath),
		RelatedObject: storagePath,
	})
}

func (s *PreservationService) LogFixityCheck(ctx context.Context, artifactID string, outcome domain.PreservationEventOutcome, match bool, algorithms []string) error {
	detail := "Fixity check passed"
	if !match {
		detail = "Fixity check failed — checksum mismatch"
	}
	return s.LogEvent(ctx, artifactID, domain.PreservationEvent{
		EventType: domain.EventFixityCheck,
		Timestamp: time.Now().UTC(),
		Agent:     "system",
		Outcome:   outcome,
		Detail:    detail,
	})
}

func (s *PreservationService) LogReplication(ctx context.Context, artifactID string, outcome domain.PreservationEventOutcome, source, destination string) error {
	return s.LogEvent(ctx, artifactID, domain.PreservationEvent{
		EventType:     domain.EventReplication,
		Timestamp:     time.Now().UTC(),
		Agent:         "system",
		Outcome:       outcome,
		Detail:        fmt.Sprintf("Replicated from %s to %s", source, destination),
		RelatedObject: destination,
	})
}

func (s *PreservationService) LogMetadataExtraction(ctx context.Context, artifactID string, outcome domain.PreservationEventOutcome, detail string) error {
	return s.LogEvent(ctx, artifactID, domain.PreservationEvent{
		EventType: domain.EventMetadataExtraction,
		Timestamp: time.Now().UTC(),
		Agent:     "system",
		Outcome:   outcome,
		Detail:    detail,
	})
}

func (s *PreservationService) GetEvents(ctx context.Context, artifactID string) ([]domain.PreservationEvent, error) {
	artifact, err := s.repo.FindByID(ctx, artifactID)
	if err != nil {
		return nil, err
	}
	if artifact == nil {
		return nil, fmt.Errorf("artifact not found: %s", artifactID)
	}
	events := artifact.PreservationEvents
	if events == nil {
		events = []domain.PreservationEvent{}
	}
	return events, nil
}

func (s *PreservationService) GetStorageLocations(ctx context.Context, artifactID string) ([]domain.StorageLocation, error) {
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

func (s *PreservationService) GetFixity(ctx context.Context, artifactID string) (*domain.FixityInfo, error) {
	artifact, err := s.repo.FindByID(ctx, artifactID)
	if err != nil {
		return nil, err
	}
	if artifact == nil {
		return nil, fmt.Errorf("artifact not found: %s", artifactID)
	}
	return artifact.Fixity, nil
}
