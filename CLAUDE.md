# Griot and Grits Platform

Digital preservation platform for African American history and culture. Go API + Next.js web app + Python AI pipelines.

### Archived (to form monorepo):
- https://github.com/griot-and-grits/gng-web
- https://github.com/griot-and-grits/gng-backend

## Repository Layout

```
apps/api/       — Go backend (hexagonal architecture: domain, port, adapter, service, handler)
apps/web/       — Next.js 15 frontend (App Router, TypeScript, Tailwind, Radix UI)
pipelines/      — Python workers for AI processing (transcription, metadata, enrichment)
packages/       — Shared contracts (OpenAPI spec, generated types)
deploy/         — Deployment configs
docs/           — Architecture docs and implementation plan
```

## Architecture

- **Go API** serves HTTP, orchestrates services, dispatches pipeline jobs
- **Python workers** consume jobs from Redis (local) or Kubeflow (production), callback to Go API with results
- **Service abstraction** — every external dependency is behind an interface in `internal/port/`. Adapters in `internal/adapter/` are swapped via config (e.g., Ollama locally, vLLM in production)
- **Storage flow:** Upload → MinIO (hot) → background processing (transcription, metadata, enrichment) → Globus or second MinIO bucket (cold)

## Development

```bash
make dev        # docker compose up (API, web, mongo, minio, redis, worker)
make api        # Go API with hot reload
make web        # Next.js dev server
make worker     # Python pipeline worker
make test       # All tests
make lint       # All linters
```

## Conventions

- Go: standard project layout, `internal/` for private packages, `cmd/` for entrypoints
- No frameworks for HTTP routing — `net/http` with Go 1.22+ patterns
- Logging via `log/slog`
- Config via Viper, env var driven
- Manual DI in `internal/wire/wire.go` — no reflection, no tags
- Frontend uses Shadcn-style components with Radix primitives
- OpenAPI spec in `packages/api-spec/openapi.yaml` is the API contract source of truth
- PREMIS-compliant preservation events for audit trails
- Feature flags for experimental features (LLM enrichment, Ask the Griot)

## Key References

- `docs/implementation-plan.md` — Full build plan with phases, decisions, and risks
- `docs/vision.md` (gitignored) — Long-term architectural direction
- Source repos being migrated: `../gng-backend/` (Python) and `../gng-web/` (Next.js)
