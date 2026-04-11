# Deployment

Two deployment targets — Cloudflare for the frontend, OpenShift for everything else.

## Overview

```
                    ┌─────────────────────────┐
                    │    Cloudflare Pages      │
                    │    (Edge / Global CDN)   │
                    │                          │
                    │    Next.js frontend      │
                    │    via @opennextjs/cf     │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────┐
│                    OpenShift / K8s                      │
│                                                        │
│   ┌─────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Go API  │  │  Worker  │  │ Whisper  │            │
│   │ (2 rep) │  │ (Python) │  │ (A100)   │            │
│   └────┬────┘  └────┬─────┘  └──────────┘            │
│        │             │                                 │
│   ┌────▼────┐  ┌────▼─────┐  ┌──────────┐            │
│   │MongoDB  │  │  Redis   │  │  MinIO   │            │
│   └─────────┘  └──────────┘  └──────────┘            │
└────────────────────────────────────────────────────────┘
```

| Component | Platform | Why |
|-----------|----------|-----|
| Frontend | Cloudflare Pages | Edge SSR, global CDN, zero cold starts, no Node server to manage |
| Go API | OpenShift | Needs direct access to MongoDB, MinIO, Redis (cluster-internal) |
| Pipeline Worker | OpenShift | Needs FFmpeg, MinIO access, callback to API (cluster-internal) |
| Whisper | OpenShift | Needs NVIDIA A100 GPU |
| MongoDB, MinIO, Redis | OpenShift | Stateful services, persistent volumes |

## Frontend — Cloudflare Pages

Uses `@opennextjs/cloudflare` to run Next.js on Cloudflare's edge runtime.

### CI/CD (automatic)

Deployments are handled by GitHub Actions (`.github/workflows/deploy-web.yml`):

- **Push to `main`** touching `apps/web/` → builds with OpenNext adapter → deploys to Cloudflare Pages production
- **Pull request** touching `apps/web/` → builds → deploys a preview URL (branch-based)

The workflow uses `cloudflare/wrangler-action` to push the built output.

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### Required GitHub variables

| Variable | Description |
|----------|-------------|
| `ADMIN_API_BASE_URL` | Go API public URL (e.g., `https://api.griotandgrits.org`) |

### Manual deploy

```bash
make deploy-web          # Production
make deploy-web-preview  # Preview
```

### Local preview (Cloudflare runtime)

```bash
cd apps/web
npm run preview   # Runs wrangler pages dev locally
```

### Config

- Wrangler config: `deploy/cloudflare/wrangler.jsonc`
- OpenNext config: `apps/web/open-next.config.ts`
- Secrets (`AUTH_SECRET`, `GITHUB_CLIENT_ID`, etc.) are set in the Cloudflare dashboard or via `wrangler secret put`

### How it works

1. `opennextjs-cloudflare build` compiles Next.js into a Cloudflare-compatible worker bundle
2. Server components, API routes, and middleware all run on the edge
3. Static assets are served from Cloudflare's CDN
4. `NEXT_PUBLIC_ADMIN_API_BASE_URL` points at the Go API's public route on OpenShift

## Backend — OpenShift / Kubernetes

Kustomize with base + overlay structure.

### Structure

```
deploy/k8s/
├── base/                    # Shared manifests
│   ├── api/                 # Go API (Deployment + Service)
│   ├── web/                 # Frontend (if also deploying on K8s)
│   ├── worker/              # Pipeline worker (Deployment)
│   ├── whisper/             # Whisper GPU (Deployment + Service)
│   ├── redis/               # Redis (Deployment + Service)
│   └── kustomization.yaml
└── overlays/
    ├── dev/                 # Single replicas, no GPU, relaxed CORS
    ├── staging/             # Full stack, staging image tags
    └── production/          # 2 replicas, Globus enabled, HSTS routes
```

### Deploy

```bash
# Production
make deploy-k8s
# or: kubectl apply -k deploy/k8s/overlays/production

# Staging
kubectl apply -k deploy/k8s/overlays/staging

# Dev
kubectl apply -k deploy/k8s/overlays/dev
```

### What each overlay changes

| | Dev | Staging | Production |
|---|-----|---------|------------|
| Namespace | `griot-grits-dev` | `griot-grits-staging` | `griot-grits-aa488b` |
| API replicas | 1 | 2 | 2 |
| Worker replicas | 1 | 1 | 2 |
| Whisper GPU | Removed | Included | Included (A100) |
| Archive | MinIO bucket | MinIO bucket | Globus Transfer |
| Transcription | Disabled | Enabled | Enabled |
| CORS | `*` | `https://staging.griotandgrits.org` | `https://www.griotandgrits.org` |
| Image tags | `latest` | `staging` | `latest` |

### Secrets

Secrets are not in the repo. Create them manually or via CI:

```bash
# API secrets
kubectl create secret generic gng-api-secret \
  --namespace=griot-grits-aa488b \
  --from-literal=DB_URI='mongodb://...' \
  --from-literal=STORAGE_ACCESS_KEY='...' \
  --from-literal=STORAGE_SECRET_KEY='...' \
  --from-literal=PIPELINE_CALLBACK_SECRET='...' \
  --from-literal=GLOBUS_CLIENT_ID='...' \
  --from-literal=GLOBUS_CLIENT_SECRET='...' \
  --from-literal=GLOBUS_ENDPOINT_ID='...'

# Worker secrets
kubectl create secret generic gng-worker-secret \
  --namespace=griot-grits-aa488b \
  --from-literal=STORAGE_ACCESS_KEY='...' \
  --from-literal=STORAGE_SECRET_KEY='...' \
  --from-literal=PIPELINE_CALLBACK_SECRET='...'
```

### Images

| Service | Registry | Image |
|---------|----------|-------|
| API | quay.io | `quay.io/griot-and-grits/gng-api` |
| Worker | quay.io | `quay.io/griot-and-grits/gng-worker` |
| Frontend | quay.io | `quay.io/griot-and-grits/gng-web` |
| Whisper | Docker Hub | `onerahmet/openai-whisper-asr-webservice:latest-gpu` |

### CI/CD (automatic)

Image builds and pushes are handled by GitHub Actions:

- `.github/workflows/deploy-api.yml` — tests, builds, pushes `gng-api` image on push to `main`
- `.github/workflows/deploy-worker.yml` — builds, pushes `gng-worker` image on push to `main`
- `.github/workflows/ci.yml` — runs lint + test + build on every PR

All deploy workflows use path filters — they only trigger when their component's code changes.

### Required GitHub secrets (for image push)

| Secret | Description |
|--------|-------------|
| `QUAY_USERNAME` | Quay.io registry username |
| `QUAY_PASSWORD` | Quay.io registry password or robot token |

### Manual build and push

```bash
# API
docker build -t quay.io/griot-and-grits/gng-api:latest apps/api
docker push quay.io/griot-and-grits/gng-api:latest

# Worker
docker build -t quay.io/griot-and-grits/gng-worker:latest pipelines/
docker push quay.io/griot-and-grits/gng-worker:latest
```

### Network topology (production)

All backend services communicate over the cluster-internal network:

| From | To | Address |
|------|----|---------|
| API | MongoDB | `mongodb-0.griot-grits-aa488b.svc.cluster.local:27017` |
| API | MinIO | `minio.griot-grits-aa488b.svc.cluster.local:9000` |
| API | Redis | `gng-redis.griot-grits-aa488b.svc.cluster.local:6379` |
| Worker | Redis | `gng-redis.griot-grits-aa488b.svc.cluster.local:6379` |
| Worker | MinIO | `minio.griot-grits-aa488b.svc.cluster.local:9000` |
| Worker | API (callback) | `gng-api.griot-grits-aa488b.svc.cluster.local:8009` |
| Worker | Whisper | `gng-whisper.griot-grits-aa488b.svc.cluster.local:9000` |
| Cloudflare | API (public) | `https://api.griotandgrits.org` (via OpenShift Route) |
