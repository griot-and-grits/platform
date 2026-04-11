package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
)

// PipelineHandlerService processes callbacks from the Python pipeline worker.
type PipelineHandlerService struct {
	repo         port.ArtifactRepo
	preservation *PreservationService
	storageLoc   *StorageLocationService
	logger       *slog.Logger
}

func NewPipelineHandlerService(
	repo port.ArtifactRepo,
	preservation *PreservationService,
	storageLoc *StorageLocationService,
	logger *slog.Logger,
) *PipelineHandlerService {
	return &PipelineHandlerService{
		repo:         repo,
		preservation: preservation,
		storageLoc:   storageLoc,
		logger:       logger,
	}
}

// HandleCallback processes a task callback from the pipeline worker.
func (s *PipelineHandlerService) HandleCallback(ctx context.Context, cb domain.PipelineCallback) error {
	artifact, err := s.repo.FindByID(ctx, cb.ArtifactID)
	if err != nil {
		return fmt.Errorf("find artifact: %w", err)
	}
	if artifact == nil {
		return fmt.Errorf("artifact not found: %s", cb.ArtifactID)
	}

	s.logger.Info("pipeline callback",
		"artifact_id", cb.ArtifactID,
		"task", cb.Task,
		"status", cb.Status,
	)

	// Update processing_metadata with task status.
	pm := artifact.ProcessingMetadata
	if pm == nil {
		pm = map[string]any{}
	}
	pm[cb.Task] = cb.Status
	if cb.Error != nil {
		pm[cb.Task+"_error"] = *cb.Error
	}

	// Apply task-specific results.
	fields := map[string]any{
		"processing_metadata": pm,
	}

	if cb.Status == "success" && cb.Result != nil {
		switch cb.Task {
		case "metadata_extraction":
			s.applyMetadataResult(fields, cb.Result)
		case "transcription":
			if transcript, ok := cb.Result["transcript"].(string); ok {
				pm["transcript"] = transcript
				fields["processing_metadata"] = pm
			}
		case "archival":
			if err := s.applyArchivalResult(ctx, cb.ArtifactID, cb.Result); err != nil {
				s.logger.Error("apply archival result", "error", err)
			}
		}
	}

	if err := s.repo.UpdateFields(ctx, cb.ArtifactID, fields); err != nil {
		return fmt.Errorf("update fields: %w", err)
	}

	// Log preservation event.
	outcome := domain.OutcomeSuccess
	detail := fmt.Sprintf("Task %s completed successfully", cb.Task)
	if cb.Status != "success" {
		outcome = domain.OutcomeFailure
		detail = fmt.Sprintf("Task %s failed", cb.Task)
		if cb.Error != nil {
			detail += ": " + *cb.Error
		}
	}

	eventType := taskToEventType(cb.Task)
	_ = s.preservation.LogEvent(ctx, cb.ArtifactID, domain.PreservationEvent{
		EventType: eventType,
		Agent:     "pipeline-worker",
		Outcome:   outcome,
		Detail:    detail,
	})

	// Check if all tasks are done — transition to READY or FAILED.
	s.checkCompletion(ctx, cb.ArtifactID, pm)

	return nil
}

func (s *PipelineHandlerService) applyMetadataResult(fields map[string]any, result map[string]any) {
	// Map ffprobe results to artifact fields where applicable.
	// Technical metadata stored in processing_metadata for now;
	// structured AudioMetadata/VideoMetadata is Phase 5.
}

func (s *PipelineHandlerService) applyArchivalResult(ctx context.Context, artifactID string, result map[string]any) error {
	path, _ := result["path"].(string)
	bucket, _ := result["bucket"].(string)
	sizeBytes, _ := result["size_bytes"].(float64)
	checksumMD5, _ := result["checksum_md5"].(string)

	if path == "" || bucket == "" {
		return fmt.Errorf("incomplete archival result")
	}

	return s.storageLoc.RegisterLocation(ctx, artifactID, domain.StorageLocation{
		StorageType:    domain.StorageTypeArchive,
		Path:           path,
		Bucket:         bucket,
		ChecksumMD5:    checksumMD5,
		SizeBytes:      int64(sizeBytes),
	})
}

// checkCompletion examines processing_metadata to determine if all tasks are done.
func (s *PipelineHandlerService) checkCompletion(ctx context.Context, artifactID string, pm map[string]any) {
	expectedTasks := []string{"metadata_extraction", "transcription", "archival"}
	allDone := true
	anyFailed := false

	for _, task := range expectedTasks {
		status, exists := pm[task].(string)
		if !exists {
			allDone = false
			continue
		}
		if status == "failure" {
			anyFailed = true
		}
		if status != "success" && status != "failure" {
			allDone = false
		}
	}

	if !allDone {
		return
	}

	var finalStatus domain.ArtifactStatus
	if anyFailed {
		finalStatus = domain.ArtifactStatusFailed
	} else {
		finalStatus = domain.ArtifactStatusReady
	}

	if err := s.repo.UpdateStatus(ctx, artifactID, finalStatus); err != nil {
		s.logger.Error("update final status", "error", err, "artifact_id", artifactID)
	} else {
		s.logger.Info("artifact status updated", "artifact_id", artifactID, "status", finalStatus)
	}
}

func taskToEventType(task string) domain.PreservationEventType {
	switch task {
	case "metadata_extraction":
		return domain.EventMetadataExtraction
	case "transcription":
		return domain.EventTranscription
	case "archival":
		return domain.EventReplication
	default:
		return domain.PreservationEventType(task)
	}
}
