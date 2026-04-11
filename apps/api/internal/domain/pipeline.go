package domain

// TaskType identifies a pipeline processing task.
type TaskType string

const (
	TaskMetadataExtraction TaskType = "metadata_extraction"
	TaskTranscription      TaskType = "transcription"
	TaskArchival           TaskType = "archival"
)

// PipelineJob is dispatched to the Redis queue for worker consumption.
type PipelineJob struct {
	ArtifactID    string     `json:"artifact_id"`
	StorageBucket string     `json:"storage_bucket"`
	StoragePath   string     `json:"storage_path"`
	CallbackURL   string     `json:"callback_url"`
	Tasks         []TaskType `json:"tasks"`
}

// PipelineCallback is received from the worker after a task completes.
type PipelineCallback struct {
	ArtifactID string         `json:"artifact_id"`
	Task       string         `json:"task"`
	Status     string         `json:"status"` // "success" or "failure"
	Result     map[string]any `json:"result"`
	Error      *string        `json:"error"`
}
