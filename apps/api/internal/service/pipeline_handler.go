package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
	"go.mongodb.org/mongo-driver/v2/bson"
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

	// Build a dotted-path $set so concurrent callbacks for different tasks
	// don't overwrite each other's fields on processing_metadata.
	fields := map[string]any{
		"processing_metadata." + cb.Task: cb.Status,
	}
	if cb.Error != nil {
		fields["processing_metadata."+cb.Task+"_error"] = *cb.Error
	}

	// Apply task-specific results.
	if cb.Status == "success" && cb.Result != nil {
		switch cb.Task {
		case "metadata_extraction":
			s.applyMetadataResult(fields, cb.Result)
		case "transcription":
			if transcript, ok := cb.Result["transcript"].(string); ok {
				fields["processing_metadata.transcript"] = transcript
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
	if err := s.preservation.LogEvent(ctx, cb.ArtifactID, domain.PreservationEvent{
		EventType: eventType,
		Agent:     "pipeline-worker",
		Outcome:   outcome,
		Detail:    detail,
	}); err != nil {
		s.logger.Error("log preservation event", "error", err, "artifact_id", cb.ArtifactID, "task", cb.Task)
	}

	// Re-fetch the artifact so checkCompletion sees every concurrent peer's updates.
	fresh, err := s.repo.FindByID(ctx, cb.ArtifactID)
	if err != nil {
		return fmt.Errorf("refetch artifact for completion check: %w", err)
	}
	if fresh != nil {
		s.checkCompletion(ctx, cb.ArtifactID, fresh.ProcessingMetadata)
	}

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
		StorageType: domain.StorageTypeArchive,
		Path:        path,
		Bucket:      bucket,
		ChecksumMD5: checksumMD5,
		SizeBytes:   int64(sizeBytes),
	})
}

// checkCompletion examines processing_metadata to determine if all tasks dispatched
// for this artifact have reported back. The expected task list is written at dispatch
// time so config drift (enabling/disabling features) can't strand in-flight artifacts.
func (s *PipelineHandlerService) checkCompletion(ctx context.Context, artifactID string, pm map[string]any) {
	expectedTasks := extractExpectedTasks(pm)
	if len(expectedTasks) == 0 {
		// No expected_tasks recorded — can't decide completion; leave status alone.
		return
	}

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

	finalStatus := domain.ArtifactStatusReady
	if anyFailed {
		finalStatus = domain.ArtifactStatusFailed
	}

	if err := s.repo.UpdateStatus(ctx, artifactID, finalStatus); err != nil {
		s.logger.Error("update final status", "error", err, "artifact_id", artifactID)
		return
	}
	s.logger.Info("artifact status updated", "artifact_id", artifactID, "status", finalStatus)
}

// extractExpectedTasks pulls the expected_tasks list out of processing_metadata.
// BSON arrays decode into bson.A ([]any), so handle both that and []string.
func extractExpectedTasks(pm map[string]any) []string {
	raw, ok := pm["expected_tasks"]
	if !ok {
		return nil
	}
	switch v := raw.(type) {
	case []string:
		return v
	case bson.A:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				out = append(out, s)
			}
		}
		return out
	case []any:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok {
				out = append(out, s)
			}
		}
		return out
	}
	return nil
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
