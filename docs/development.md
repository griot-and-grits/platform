# Development Guide

## Prerequisites

- Go 1.26+
- Node.js 22+ (for frontend)
- Docker and Docker Compose
- Python 3.13+ (for bare-metal pipeline worker)

Optional:
- [air](https://github.com/air-verse/air) — Go hot reload (`go install github.com/air-verse/air@latest`)

## Quick Start

```bash
# Copy environment config
cp .env.example .env

# Start everything
make dev
```

This starts:
- Next.js frontend on port **6730**
- Go API on port **6731**
- Python pipeline worker
- MongoDB on port **6732**
- MinIO on ports **6733** (API) / **6734** (console)
- Redis on port **6735**
- MinIO init container (creates `artifacts` and `archive` buckets, then exits)

All ports are in the `67xx` range to avoid conflicts with common dev tools (local MongoDB, Redis, Node servers, etc.).

All services hot reload out of the box:
- **Go API** — uses [air](https://github.com/air-verse/air) inside Docker, rebuilds on file save
- **Next.js frontend** — `npm run dev` with Turbopack, standard HMR
- **Python worker** — rebuild container on change (`docker compose up --build worker`)

### Bare-metal development (alternative)

Run services directly on your machine for faster iteration:

```bash
# Start just the databases
docker compose up mongo minio minio-init redis

# In separate terminals:
make api       # Go API with hot reload (requires: go install github.com/air-verse/air@latest)
make web       # Next.js dev server (requires: cd apps/web && npm install)
make worker    # Python pipeline worker (requires: cd pipelines && pip install -r requirements.txt)
```

When running bare-metal, connection strings use `localhost` with the `67xx` ports (see `.env.example`).
When running in Docker Compose, services connect internally by container name (`mongo`, `minio`, `redis`) on default ports.

## Make Targets

| Target | What it does |
|--------|-------------|
| `make dev` | `docker compose up --build` (api, web, worker, mongo, minio, redis) |
| `make dev-ai` | Above + Ollama for local LLM |
| `make api` | `cd apps/api && air` (Go hot reload) |
| `make web` | `cd apps/web && npm run dev` (Next.js) |
| `make worker` | `cd pipelines && python -m worker` |
| `make test` | `go test ./...` |
| `make lint` | `go vet ./...` |
| `make build` | `docker compose build` (all images) |
| `make seed` | Populate MongoDB with test artifacts |
| `make spec` | Generate TypeScript types from OpenAPI spec |
| `make clean` | `docker compose down -v` (stops everything, removes volumes) |

## Environment Variables

Copy `.env.example` to `.env`. All variables have sensible defaults for local development.

### Core

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | `development`, `staging`, or `production` |
| `SERVER_PORT` | `8009` | Go API listen port |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URI` | `mongodb://localhost:27017/` | MongoDB connection string |
| `DB_NAME` | `gngdb` | Database name |

### Storage (MinIO/S3)

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_ENDPOINT` | `localhost:9000` | MinIO endpoint |
| `STORAGE_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `STORAGE_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `STORAGE_BUCKET` | `artifacts` | Hot storage bucket |
| `STORAGE_SECURE` | `false` | Use HTTPS for MinIO |

### Archive

| Variable | Default | Description |
|----------|---------|-------------|
| `ARCHIVE_PROVIDER` | `minio-archive` | `minio-archive` or `globus` |
| `ARCHIVE_BUCKET` | `archive` | Archive bucket name |
| `GLOBUS_ENABLED` | `false` | Enable Globus integration |
| `GLOBUS_ENDPOINT_ID` | — | Globus endpoint UUID |
| `GLOBUS_BASE_PATH` | — | Base path on Globus endpoint |
| `GLOBUS_CLIENT_ID` | — | OAuth client ID |
| `GLOBUS_CLIENT_SECRET` | — | OAuth client secret |

### Pipeline

| Variable | Default | Description |
|----------|---------|-------------|
| `PIPELINE_PROVIDER` | `redis-queue` | `redis-queue` or `kubeflow` |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `PIPELINE_CALLBACK_SECRET` | `dev-secret-change-me` | Shared secret for worker auth |
| `PIPELINE_CALLBACK_URL` | `http://localhost:8009` | Where workers POST callbacks |

### Processing Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `PROCESSING_ENABLE_METADATA_EXTRACTION` | `true` | Run FFmpeg metadata extraction |
| `PROCESSING_ENABLE_TRANSCRIPTION` | `false` | Run Whisper transcription |
| `PROCESSING_ENABLE_LLM_ENRICHMENT` | `false` | Run LLM enrichment (Phase 5) |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

## Testing

```bash
make test           # All Go tests
make test-api       # Go API tests only
```

Test layers:
- **Unit tests** (`internal/service/`) — mock port interfaces, test business logic
- **Domain tests** (`internal/domain/`) — JSON marshal/unmarshal, contract verification
- **Integration tests** (`internal/adapter/`) — testcontainers-go with real MongoDB and MinIO (planned)
- **API tests** (`internal/handler/`) — httptest with full handler stack (planned)
- **E2E** — Playwright against the running stack (in `apps/web/tests/`)

## Docker Compose Services

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `web` | `node:22-alpine` | 6730 | Next.js dev server |
| `api` | Built from `apps/api/Dockerfile` | 6731 | Go API |
| `mongo` | `mongo:8` | 6732 | MongoDB |
| `minio` | `minio/minio:latest` | 6733, 6734 | Object storage (API, console) |
| `minio-init` | `minio/mc:latest` | — | Creates buckets, then exits |
| `redis` | `redis:8-alpine` | 6735 | Pipeline job queue |
| `worker` | Built from `pipelines/Dockerfile` | — | Python pipeline worker |
| `ollama` | `ollama/ollama:latest` | 6736 | Local LLM (profile: `ai`) |

Only `ollama` is behind a profile since it's optional and heavy. Everything else starts with `make dev`.

## MinIO Console

Access the MinIO web console at `http://localhost:6734` (login: `minioadmin` / `minioadmin`). You can browse uploaded artifacts, check the archive bucket, and verify file integrity.
