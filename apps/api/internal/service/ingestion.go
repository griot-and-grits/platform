package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/griotandgrits/platform/apps/api/internal/config"
	"github.com/griotandgrits/platform/apps/api/internal/domain"
	"github.com/griotandgrits/platform/apps/api/internal/port"
)

// IngestionService orchestrates artifact ingestion.
type IngestionService struct {
	repo         port.ArtifactRepo
	store        port.ObjectStore
	fixity       *FixityService
	preservation *PreservationService
	storageLoc   *StorageLocationService
	cfg          *config.Config
	dispatcher   port.PipelineDispatcher
}

func NewIngestionService(
	repo port.ArtifactRepo,
	store port.ObjectStore,
	fixity *FixityService,
	preservation *PreservationService,
	storageLoc *StorageLocationService,
	cfg *config.Config,
	dispatcher port.PipelineDispatcher,
) *IngestionService {
	return &IngestionService{
		repo:         repo,
		store:        store,
		fixity:       fixity,
		preservation: preservation,
		storageLoc:   storageLoc,
		cfg:          cfg,
		dispatcher:   dispatcher,
	}
}

// Ingest handles Path A: streaming upload through the API for files ≤100MB.
// The file reader is streamed through a TeeReader for simultaneous checksum + upload.
func (s *IngestionService) Ingest(ctx context.Context, file io.Reader, filename, contentType string, metadata domain.IngestionMetadata) (*domain.IngestionResponse, error) {
	now := time.Now().UTC()
	ext := filepath.Ext(filename)

	// Create artifact record with processing status.
	artifact := &domain.Artifact{
		Title:            metadata.Title,
		Description:      metadata.Description,
		Creator:          metadata.Creator,
		CreationDate:     metadata.CreationDate,
		Type:             metadata.Type,
		Format:           metadata.Format,
		Language:         metadata.Language,
		Subject:          metadata.Subject,
		Rights:           metadata.Rights,
		Status:           domain.ArtifactStatusProcessing,
		OriginalFilename: filename,
		FileExtension:    ext,
		MIMEType:         contentType,
		UploadedAt:       &now,
		Version:          1,
	}

	artifactID, err := s.repo.Insert(ctx, artifact)
	if err != nil {
		return nil, fmt.Errorf("insert artifact: %w", err)
	}

	// Wrap reader in TeeReader for streaming checksums.
	teeReader, acc := s.fixity.NewTeeReader(file)

	// Build storage path and upload to MinIO.
	storagePath := s.storageLoc.BuildStoragePath(artifactID, filename, domain.StorageTypeHot)
	uploadMeta := map[string]string{
		"title":         metadata.Title,
		"creator":       metadata.Creator,
		"creation-date": metadata.CreationDate,
	}

	// size=-1 enables automatic multipart upload for any file size.
	if err := s.store.Upload(ctx, s.cfg.Storage.Bucket, storagePath, teeReader, -1, contentType, uploadMeta); err != nil {
		s.markFailed(ctx, artifactID, "api", fmt.Sprintf("Storage upload failed: %v", err))
		return nil, fmt.Errorf("upload to storage: %w", err)
	}

	// Retrieve checksums and size from accumulator.
	md5sum := acc.MD5()
	sha256sum := acc.SHA256()
	size := acc.Size()
	fixityInfo := s.fixity.GenerateFixityInfo(md5sum, sha256sum)

	// Update artifact with fixity and size.
	if err := s.repo.UpdateFields(ctx, artifactID, map[string]any{
		"fixity":     fixityInfo,
		"size_bytes": size,
	}); err != nil {
		return nil, fmt.Errorf("update fixity: %w", err)
	}

	// Register storage location.
	if err := s.storageLoc.RegisterLocation(ctx, artifactID, domain.StorageLocation{
		StorageType:    domain.StorageTypeHot,
		Path:           storagePath,
		Bucket:         s.cfg.Storage.Bucket,
		Endpoint:       s.cfg.Storage.Endpoint,
		ChecksumMD5:    md5sum,
		ChecksumSHA256: sha256sum,
		SizeBytes:      size,
		StoredAt:       now,
	}); err != nil {
		return nil, fmt.Errorf("register storage location: %w", err)
	}

	// Log ingestion preservation event.
	if err := s.preservation.LogIngestion(ctx, artifactID, domain.OutcomeSuccess, storagePath, "api"); err != nil {
		return nil, fmt.Errorf("log ingestion event: %w", err)
	}

	// Determine final status and dispatch pipeline if needed.
	finalStatus := domain.ArtifactStatusReady
	if s.cfg.Processing.EnableMetadataExtraction || s.cfg.Processing.EnableTranscription {
		finalStatus = domain.ArtifactStatusProcessing
	}
	if err := s.repo.UpdateStatus(ctx, artifactID, finalStatus); err != nil {
		return nil, fmt.Errorf("update final status: %w", err)
	}

	// Dispatch pipeline job for background processing.
	if finalStatus == domain.ArtifactStatusProcessing {
		s.dispatchPipelineJob(ctx, artifactID, s.cfg.Storage.Bucket, storagePath)
	}

	return &domain.IngestionResponse{
		ArtifactID: artifactID,
		Status:     finalStatus,
		Message:    fmt.Sprintf("Artifact ingested successfully to %s", storagePath),
		UploadPath: storagePath,
	}, nil
}

// RequestUploadURL handles Path B step 1: presigned URL for direct-to-storage uploads.
func (s *IngestionService) RequestUploadURL(ctx context.Context, req domain.UploadURLRequest) (*domain.UploadURLResponse, error) {
	now := time.Now().UTC()
	ext := filepath.Ext(req.Filename)

	artifact := &domain.Artifact{
		Title:            req.Metadata.Title,
		Description:      req.Metadata.Description,
		Creator:          req.Metadata.Creator,
		CreationDate:     req.Metadata.CreationDate,
		Type:             req.Metadata.Type,
		Format:           req.Metadata.Format,
		Language:         req.Metadata.Language,
		Subject:          req.Metadata.Subject,
		Rights:           req.Metadata.Rights,
		Status:           domain.ArtifactStatusUploading,
		OriginalFilename: req.Filename,
		FileExtension:    ext,
		MIMEType:         req.ContentType,
		UploadedAt:       &now,
		Version:          1,
	}
	if req.SizeBytes > 0 {
		artifact.SizeBytes = &req.SizeBytes
	}

	artifactID, err := s.repo.Insert(ctx, artifact)
	if err != nil {
		return nil, fmt.Errorf("insert artifact: %w", err)
	}

	storagePath := s.storageLoc.BuildStoragePath(artifactID, req.Filename, domain.StorageTypeHot)
	expiry := 1 * time.Hour

	url, err := s.store.PresignPutURL(ctx, s.cfg.Storage.Bucket, storagePath, req.ContentType, expiry)
	if err != nil {
		s.markFailed(ctx, artifactID, "api", fmt.Sprintf("Presign URL failed: %v", err))
		return nil, fmt.Errorf("presign put url: %w", err)
	}

	// Store the storage path in processing_metadata so ConfirmUpload can find it.
	_ = s.repo.UpdateFields(ctx, artifactID, map[string]any{
		"processing_metadata": map[string]any{
			"storage_path": storagePath,
		},
	})

	return &domain.UploadURLResponse{
		ArtifactID: artifactID,
		UploadURL:  url,
		ExpiresAt:  now.Add(expiry),
	}, nil
}

// ConfirmUpload handles Path B step 2: verify presigned upload completed and finalize.
func (s *IngestionService) ConfirmUpload(ctx context.Context, artifactID string) (*domain.IngestionResponse, error) {
	artifact, err := s.repo.FindByID(ctx, artifactID)
	if err != nil {
		return nil, fmt.Errorf("find artifact: %w", err)
	}
	if artifact == nil {
		return nil, fmt.Errorf("artifact not found: %s", artifactID)
	}
	if artifact.Status != domain.ArtifactStatusUploading {
		return nil, fmt.Errorf("artifact %s is not in uploading state (current: %s)", artifactID, artifact.Status)
	}

	// Get storage path from processing_metadata.
	storagePath, _ := artifact.ProcessingMetadata["storage_path"].(string)
	if storagePath == "" {
		return nil, fmt.Errorf("storage path not found for artifact %s", artifactID)
	}

	// Verify the object exists in MinIO.
	objInfo, err := s.store.StatObject(ctx, s.cfg.Storage.Bucket, storagePath)
	if err != nil {
		return nil, fmt.Errorf("object not found at %s: %w", storagePath, err)
	}

	// Stream from MinIO for checksum calculation.
	reader, err := s.store.Download(ctx, s.cfg.Storage.Bucket, storagePath)
	if err != nil {
		return nil, fmt.Errorf("download for checksums: %w", err)
	}
	defer reader.Close()

	md5sum, sha256sum, _, err := s.fixity.CalculateChecksums(reader)
	if err != nil {
		return nil, fmt.Errorf("calculate checksums: %w", err)
	}

	fixityInfo := s.fixity.GenerateFixityInfo(md5sum, sha256sum)

	// Update artifact with fixity and size.
	if err := s.repo.UpdateFields(ctx, artifactID, map[string]any{
		"fixity":     fixityInfo,
		"size_bytes": objInfo.Size,
		"status":     string(domain.ArtifactStatusProcessing),
	}); err != nil {
		return nil, fmt.Errorf("update fixity: %w", err)
	}

	// Register storage location.
	if err := s.storageLoc.RegisterLocation(ctx, artifactID, domain.StorageLocation{
		StorageType:    domain.StorageTypeHot,
		Path:           storagePath,
		Bucket:         s.cfg.Storage.Bucket,
		Endpoint:       s.cfg.Storage.Endpoint,
		ChecksumMD5:    md5sum,
		ChecksumSHA256: sha256sum,
		SizeBytes:      objInfo.Size,
		StoredAt:       time.Now().UTC(),
	}); err != nil {
		return nil, fmt.Errorf("register storage location: %w", err)
	}

	// Log ingestion preservation event.
	if err := s.preservation.LogIngestion(ctx, artifactID, domain.OutcomeSuccess, storagePath, "api"); err != nil {
		return nil, fmt.Errorf("log ingestion event: %w", err)
	}

	// Determine final status and dispatch pipeline.
	finalStatus := domain.ArtifactStatusReady
	if s.cfg.Processing.EnableMetadataExtraction || s.cfg.Processing.EnableTranscription {
		finalStatus = domain.ArtifactStatusProcessing
	}
	if err := s.repo.UpdateStatus(ctx, artifactID, finalStatus); err != nil {
		return nil, fmt.Errorf("update final status: %w", err)
	}

	if finalStatus == domain.ArtifactStatusProcessing {
		s.dispatchPipelineJob(ctx, artifactID, s.cfg.Storage.Bucket, storagePath)
	}

	return &domain.IngestionResponse{
		ArtifactID: artifactID,
		Status:     finalStatus,
		Message:    fmt.Sprintf("Upload confirmed and processed at %s", storagePath),
		UploadPath: storagePath,
	}, nil
}

// markFailed sets artifact to failed and logs a failure preservation event.
func (s *IngestionService) markFailed(ctx context.Context, artifactID, agent, detail string) {
	_ = s.preservation.LogEvent(ctx, artifactID, domain.PreservationEvent{
		EventType: domain.EventIngestion,
		Agent:     agent,
		Outcome:   domain.OutcomeFailure,
		Detail:    detail,
	})
	_ = s.repo.UpdateStatus(ctx, artifactID, domain.ArtifactStatusFailed)
}

// dispatchPipelineJob builds and dispatches a job to the Redis pipeline queue.
func (s *IngestionService) dispatchPipelineJob(ctx context.Context, artifactID, bucket, storagePath string) {
	var tasks []domain.TaskType
	if s.cfg.Processing.EnableMetadataExtraction {
		tasks = append(tasks, domain.TaskMetadataExtraction)
	}
	if s.cfg.Processing.EnableTranscription {
		tasks = append(tasks, domain.TaskTranscription)
	}
	// Always archive after processing.
	tasks = append(tasks, domain.TaskArchival)

	job := domain.PipelineJob{
		ArtifactID:    artifactID,
		StorageBucket: bucket,
		StoragePath:   storagePath,
		CallbackURL:   s.cfg.Pipeline.CallbackURL,
		Tasks:         tasks,
	}

	if err := s.dispatcher.Dispatch(ctx, job); err != nil {
		// Log but don't fail ingestion — the artifact is already stored.
		// A retry mechanism or manual re-dispatch can handle this.
		_ = s.preservation.LogEvent(ctx, artifactID, domain.PreservationEvent{
			EventType: domain.EventIngestion,
			Agent:     "api",
			Outcome:   domain.OutcomeWarning,
			Detail:    fmt.Sprintf("Pipeline dispatch failed: %v", err),
		})
	}
}

// detectContentType infers a MIME type from filename if not provided.
func detectContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".mov":
		return "video/quicktime"
	case ".avi":
		return "video/x-msvideo"
	case ".mkv":
		return "video/x-matroska"
	case ".mp3":
		return "audio/mpeg"
	case ".wav":
		return "audio/wav"
	case ".flac":
		return "audio/flac"
	case ".ogg":
		return "audio/ogg"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".pdf":
		return "application/pdf"
	default:
		return "application/octet-stream"
	}
}
