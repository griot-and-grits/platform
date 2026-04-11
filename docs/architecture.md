# Architecture

## System Overview

Three layers, loosely coupled through interfaces and a job queue:

- **Go API** (`apps/api/`) — HTTP server, business logic, pipeline dispatch. Owns the data model and orchestrates everything.
- **Next.js Frontend** (`apps/web/`) — Admin portal for uploading artifacts, browsing collections, viewing preservation events. Public-facing catalog and "Ask the Griot" chatbot.
- **Python Pipeline Workers** (`pipelines/`) — Background AI processing. Consumes jobs from a queue, processes media files, reports results back to the Go API via HTTP callbacks.

## Storage Flow

What happens when an admin uploads an oral history:

```
Admin uploads artifact (audio/video file + metadata)
    │
    ▼
Go API receives file
    │
    ├── Streams to MinIO (hot storage) via TeeReader
    │   └── Checksums (MD5 + SHA-256) calculated during upload (single pass)
    ├── Creates artifact record in MongoDB (status: PROCESSING)
    ├── Logs PREMIS preservation event: ingestion
    └── Dispatches job to pipeline queue (Redis LPUSH)
            │
            ▼
    Python worker picks up job (Redis BLPOP)
        │
        ├── 1. Metadata extraction (FFmpeg/ffprobe)
        │      → POST callback to Go API → logs PREMIS event
        │
        ├── 2. Transcription (Whisper ASR)
        │      → POST callback to Go API → logs PREMIS event
        │
        └── 3. Archive to cold storage (MinIO bucket copy / Globus)
               → POST callback to Go API → logs PREMIS event
               → All tasks done → status: READY
```

### Two Upload Paths

**Path A — Streaming multipart (files ≤ 100MB)**

Standard `POST /artifacts/ingest` with `multipart/form-data`. The Go API streams the file directly through an `io.TeeReader` that simultaneously calculates checksums and uploads to MinIO. Never buffers the full file in memory.

**Path B — Presigned URL (files > 100MB, up to 10GB+)**

1. `POST /artifacts/upload-url` — API creates artifact record, returns a MinIO presigned PUT URL
2. Client uploads directly to MinIO (S3 multipart protocol handles chunking, retries, resume)
3. `POST /artifacts/{id}/confirm-upload` — API verifies upload, calculates checksums, triggers pipeline

Presigned URLs exist because streaming 10GB+ through a reverse proxy hits request timeouts, memory limits, and can't leverage S3's native multipart parallelism.

## Go API — Hexagonal Architecture

Every external dependency sits behind an interface in `internal/port/`. Concrete implementations live in `internal/adapter/` and are swapped via config.

```
cmd/api/main.go                  ← entrypoint
internal/
├── config/                      ← Viper env config
├── domain/                      ← Pure data structs (Artifact, Collection, etc.)
│                                  No external deps. JSON tags match frontend contract.
├── port/                        ← Interfaces
│   ├── storage.go               ← ObjectStore (Upload, Download, PresignPutURL, StatObject)
│   ├── database.go              ← ArtifactRepo, CollectionRepo
│   └── pipeline.go              ← PipelineDispatcher
├── adapter/
│   ├── mongo/                   ← ArtifactRepo + CollectionRepo (MongoDB driver v2)
│   ├── storage/                 ← ObjectStore (MinIO, presigned URLs)
│   └── pipeline/                ← PipelineDispatcher (Redis LPUSH)
├── service/
│   ├── ingestion.go             ← Upload orchestrator (Path A + Path B + job dispatch)
│   ├── fixity.go                ← TeeReader checksums (MD5 + SHA-256, single pass)
│   ├── preservation.go          ← PREMIS event logging
│   ├── storage_location.go      ← Storage tier tracking
│   └── pipeline_handler.go      ← Process worker callbacks, update artifacts
├── handler/                     ← HTTP handlers (thin — parse request, call service, write response)
├── server/                      ← HTTP server with graceful shutdown
└── wire/                        ← Manual dependency injection (no reflection, no code gen)
```

### Why This Structure

- **domain/** has zero imports from other packages. It's the core data model and can be tested in isolation.
- **port/** defines what the application needs, not how it gets it. Adding a new storage backend means implementing the `ObjectStore` interface — nothing else changes.
- **adapter/** is the only place that imports external libraries (MongoDB driver, MinIO SDK, Redis client). Adapters are swapped by changing which one `wire.go` instantiates.
- **service/** contains all business logic. Services depend on port interfaces, never on adapters directly. This makes unit testing straightforward — mock the interfaces.
- **handler/** is a thin HTTP translation layer. Parses requests, calls services, writes JSON responses. No business logic lives here.
- **wire.go** is the composition root. It wires everything together with plain Go constructors. No dependency injection framework, no struct tags, no reflection.

## Service Abstraction Map

Every external dependency has an interface. Production and local dev use different implementations, swapped via environment config:

| Capability | Interface | Production | Local Dev |
|------------|-----------|------------|-----------|
| Object storage (hot) | `ObjectStore` | MinIO enterprise | MinIO single node |
| Cold archive | `ArchiveStore` | Globus Transfer API | Second MinIO bucket |
| AI inference (LLM) | `LLMProvider` | vLLM on OpenShift AI | Ollama |
| Transcription | `Transcriber` | Whisper API (GPU, A100) | Whisper.cpp / Ollama |
| Pipeline orchestration | `PipelineDispatcher` | Kubeflow Pipelines | Redis queue |
| Database | `ArtifactRepo` | MongoDB (managed) | MongoDB (container) |

## Data Model

The frontend TypeScript types in `apps/web/lib/admin/types.ts` are the API contract source of truth. The Go domain structs match these types exactly via JSON struct tags.

Key entities:

- **Artifact** — A preserved digital object (audio, video, document). Has status lifecycle: `uploading → processing → ready` (or `failed`).
- **StorageLocation** — Where an artifact's file is stored. Each artifact can have multiple locations (hot + archive = dual-tier preservation).
- **PreservationEvent** — PREMIS-compliant audit trail entry. Every operation (ingestion, fixity check, replication, transcription) is logged.
- **FixityInfo** — Checksums (MD5 + SHA-256) for integrity verification.
- **Collection** — A group of artifacts packaged for archival (uses Globus for cold storage transfers).

## PREMIS Compliance

Every mutation to an artifact's state generates a preservation event following the PREMIS standard:

| Event Type | When |
|------------|------|
| `ingestion` | File uploaded and stored |
| `fixity_check` | Checksums verified |
| `metadata_extraction` | FFmpeg extracts technical metadata |
| `transcription` | Whisper generates transcript |
| `replication` | File copied to archive storage |
| `validation` | Format/content validated |
| `deletion` | File removed |

Events are stored as an array on the artifact document in MongoDB. The `GET /preservation/artifacts/{id}/events` endpoint returns the full audit trail.
