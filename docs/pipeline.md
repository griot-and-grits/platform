# Pipeline Architecture

## Overview

The pipeline is the background processing layer that runs after an artifact is uploaded. It handles the compute-heavy work that can't happen synchronously during an HTTP request: extracting technical metadata, transcribing audio, and archiving to cold storage.

The Python backend that this replaces had a critical bug — it set artifact status to `PROCESSING` or `READY` without ever dispatching a background job. Artifacts either sat in `PROCESSING` forever or skipped processing entirely. The Go API fixes this by making pipeline dispatch a required step after upload.

## Tasks

### 1. Metadata Extraction (`tasks/metadata.py`)

- Downloads the artifact from MinIO
- Runs `ffprobe -print_format json -show_format -show_streams` against it
- Extracts: duration, codec, resolution, frame rate, channels, sample rate, file size
- Posts result to Go API callback

This populates the technical metadata displayed on the artifact detail page.

### 2. Transcription (`tasks/transcription.py`)

- Downloads the artifact from MinIO
- Extracts audio to 16kHz mono WAV via `ffmpeg` (Whisper's optimal input format)
- Sends WAV to an external Whisper ASR service (`POST /asr`)
- Posts transcript text to Go API callback

This is the core preservation capability — converting spoken word into searchable, indexable text.

### 3. Archival (`tasks/archival.py`)

- Issues a server-side copy from the `artifacts` bucket to the `archive` bucket in MinIO
- No data flows through the worker — it's a copy instruction to the storage server
- Posts the new storage location details to Go API callback

In production, this task uses the Globus Transfer API instead of MinIO copy, moving files to tape or cold storage for long-term preservation.

## Communication Protocol

### Job Dispatch (Go API → Queue)

When the ingestion service finishes uploading an artifact, it pushes a job to Redis:

```
LPUSH gng:pipeline:jobs <JSON>
```

Job payload:
```json
{
    "artifact_id": "6617abc123def456",
    "storage_bucket": "artifacts",
    "storage_path": "artifacts/2025/04/6617abc123def456/interview.mp4",
    "callback_url": "http://api:8009",
    "tasks": ["metadata_extraction", "transcription", "archival"]
}
```

The task list is built from config flags:
- `PROCESSING_ENABLE_METADATA_EXTRACTION=true` → includes `metadata_extraction`
- `PROCESSING_ENABLE_TRANSCRIPTION=true` → includes `transcription`
- `archival` is always included

### Job Consumption (Queue → Worker)

The Python worker blocks on `BLPOP gng:pipeline:jobs` with a 5-second timeout (to check for shutdown signals). When a job arrives, it runs each task sequentially in the order specified by the `tasks` array.

### Result Callback (Worker → Go API)

After each task completes (success or failure), the worker posts the result:

```
POST /internal/pipeline/callback
Authorization: Bearer {PIPELINE_CALLBACK_SECRET}
Content-Type: application/json

{
    "artifact_id": "6617abc123def456",
    "task": "metadata_extraction",
    "status": "success",
    "result": {
        "duration_seconds": 3600,
        "video_codec": "h264",
        "width": 1920,
        "height": 1080,
        "frame_rate": 29.97,
        "audio_codec": "aac",
        "channels": 2,
        "sample_rate": "48000"
    },
    "error": null
}
```

On failure:
```json
{
    "artifact_id": "6617abc123def456",
    "task": "transcription",
    "status": "failure",
    "result": null,
    "error": "Whisper API returned 503: service unavailable"
}
```

### Callback Processing (Go API)

The Go API's `PipelineHandlerService` receives each callback and:

1. Updates `processing_metadata` on the artifact with the task status
2. Applies task-specific results (metadata fields, transcript text, new storage location)
3. Logs a PREMIS preservation event
4. Checks if all tasks are done — if yes, transitions status to `READY` (all succeeded) or `FAILED` (any failed)

Authentication uses a shared secret (`PIPELINE_CALLBACK_SECRET`) passed in the `Authorization: Bearer` header. This is an internal endpoint — not exposed to the frontend.

## Task Independence

Tasks run sequentially but are independent. If metadata extraction fails:
- Transcription still runs
- Archival still runs
- The artifact ends up in `FAILED` status, but the successful results are still stored

This matters for preservation — a transcription failure shouldn't prevent archival.

## Local Dev vs Enterprise Production

The `PipelineDispatcher` interface in the Go API:

```go
type PipelineDispatcher interface {
    Dispatch(ctx context.Context, job PipelineJob) error
}
```

### Local: Redis Queue (`redis_queue.go`)

```
Go API ──LPUSH──▶ Redis ──BLPOP──▶ Python worker container
                                        │
                                        ├── ffprobe (local ffmpeg)
                                        ├── Whisper (local API / Ollama)
                                        └── MinIO copy (bucket → bucket)
```

- Single Python container runs all tasks sequentially per job
- Redis is the queue (zero infrastructure overhead)
- `docker compose --profile pipeline up` starts everything
- Config: `PIPELINE_PROVIDER=redis-queue`

### Production: Kubeflow Pipelines (`kubeflow.go`)

```
Go API ──HTTP──▶ Kubeflow API ──schedules──▶ K8s pods on OpenShift
                                                  │
                                 ┌────────────────┼────────────────┐
                                 │                │                │
                           ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐
                           │ FFprobe   │  │ Whisper     │  │ Globus    │
                           │ pod       │  │ GPU pod     │  │ transfer  │
                           └─────┬─────┘  └──────┬──────┘  └─────┬─────┘
                                 │               │               │
                                 └───── POST /internal/pipeline/callback
```

What changes:

| Concern | Local | Production |
|---------|-------|------------|
| Job dispatch | `LPUSH` to Redis | HTTP to Kubeflow Pipelines API |
| Task execution | Single container, sequential | Separate K8s pods, parallelizable |
| Transcription | Whisper.cpp / Ollama (CPU) | Whisper on NVIDIA A100 GPU |
| Archival | MinIO bucket-to-bucket | Globus Transfer API to tape/cold |
| Scaling | 1 worker | Kubeflow auto-scales pods per task |
| Monitoring | Container logs | Kubeflow UI, DAG visualization |
| Retries | Manual | Kubeflow built-in retry policies |

**The callback contract is identical.** Whether a Redis worker or a Kubeflow pod ran the task, the Go API receives the same JSON at the same endpoint. Swapping is a config change (`PIPELINE_PROVIDER=kubeflow`), not a code change.

## Graceful Shutdown

The Python worker handles `SIGINT` and `SIGTERM`. When a shutdown signal arrives, it finishes the current job before exiting. The `BLPOP` timeout (5 seconds) ensures the worker checks the shutdown flag regularly even when idle.
