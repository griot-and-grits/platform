.PHONY: dev dev-ai api web worker test test-api lint lint-api build deploy deploy-web deploy-k8s clean seed spec


# ─── Primary targets ───────────────────────────────────────────────────────────

## Start everything (api, web, worker, mongo, minio, redis)
dev:
	docker compose up --build

## Start everything + Ollama for local LLM
dev-ai:
	docker compose --profile ai up --build

# ─── Individual services (bare-metal, for fast iteration) ──────────────────────

## Run Go API with hot reload
api:
	cd apps/api && air

## Run Next.js dev server
web:
	cd apps/web && npm run dev

## Run Python pipeline worker
worker:
	cd pipelines && python -m worker

# ─── Quality ───────────────────────────────────────────────────────────────────

## Run all tests
test: test-api

## Run Go API tests
test-api:
	cd apps/api && go test ./... -v -count=1

## Run all linters
lint: lint-api

## Run Go linter
lint-api:
	cd apps/api && go vet ./...

# ─── Build ─────────────────────────────────────────────────────────────────────

## Build all Docker images
build:
	docker compose build

# ─── Deploy ────────────────────────────────────────────────────────────────────

## Deploy frontend to Cloudflare Workers
deploy-web:
	cd apps/web && npm run deploy

## Deploy to OpenShift/K8s (production overlay)
deploy-k8s:
	kubectl apply -k deploy/k8s/overlays/production

# ─── Data ──────────────────────────────────────────────────────────────────────

## Seed MongoDB with test data
seed:
	cd apps/api && go run ./scripts/seed/main.go

# ─── Contract ──────────────────────────────────────────────────────────────────

## Generate TypeScript types from OpenAPI spec
spec:
	cd packages/api-spec && npm run generate

# ─── Cleanup ───────────────────────────────────────────────────────────────────

## Stop all services and remove volumes
clean:
	docker compose --profile ai down -v
