# Griot and Grits Platform

Digital preservation platform for African American history and culture. Preserving the African American experience one voice at a time using AI.

### Archived (to form monorepo):
- https://github.com/griot-and-grits/gng-web
- https://github.com/griot-and-grits/gng-backend


```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Go API     │     │   Pipeline   │
│  (Next.js)   │────▶│  (apps/api)  │────▶│   Workers    │
│  port 6730   │     │  port 6731   │     │  (Python)    │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                    ┌───────┼─────────────────────┤
                    │       │                     │
               ┌────▼───┐ ┌▼────────┐ ┌──────────▼──┐
               │MongoDB │ │  MinIO  │ │    Redis    │
               │        │ │ (S3)    │ │  (job queue)│
               └────────┘ └─────────┘ └─────────────┘
```

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `apps/api/` | Go 1.26, net/http, MongoDB, MinIO | HTTP API, orchestration, pipeline dispatch |
| `apps/web/` | Next.js 15, React 19, TypeScript, Tailwind | Admin portal, public catalog, upload UI |
| `pipelines/` | Python 3.13, FFmpeg, Whisper | Background AI processing |
| `packages/` | OpenAPI spec | Shared API contracts |

## Quick Start

```bash
make dev              # Start everything (API, frontend, worker, databases)
make deploy-web       # Deploy frontend to Cloudflare Pages
make deploy-k8s       # Deploy backend to OpenShift
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | System design, hexagonal structure, service abstractions |
| [Pipeline](docs/pipeline.md) | Background processing tasks, callback protocol, local vs production |
| [API Reference](docs/api.md) | All endpoints, upload flows, request/response formats |
| [Deployment](docs/deployment.md) | Cloudflare Pages (frontend), OpenShift/K8s (backend), Kustomize overlays |
| [Development](docs/development.md) | Setup, make targets, environment variables |
| [Implementation Plan](docs/implementation-plan.md) | Build phases, design decisions, risks |
