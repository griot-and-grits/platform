# API Reference

Base URL: `http://localhost:8009` (configurable via `SERVER_PORT`)

All responses are JSON. Error responses use `{"detail": "error message"}`.

## Artifacts

### Upload Artifact (Path A — Streaming)

For files ≤ 100MB. Streams through the API with simultaneous checksum calculation.

```
POST /artifacts/ingest
Content-Type: multipart/form-data
```

Form fields:
- `file` — The artifact file (binary)
- `metadata` — JSON string with ingestion metadata:

```json
{
    "title": "Interview with John Doe",
    "description": "Oral history discussing the Civil Rights Movement",
    "creator": "Jane Smith",
    "creation_date": "1965-03-15",
    "type": "video",
    "format": "mp4",
    "language": ["en"],
    "subject": ["civil rights", "oral history"],
    "rights": "CC BY-NC 4.0"
}
```

Response `201`:
```json
{
    "artifact_id": "6617abc123def456",
    "status": "processing",
    "message": "Artifact ingested successfully to artifacts/2025/04/6617.../interview.mp4",
    "upload_path": "artifacts/2025/04/6617.../interview.mp4"
}
```

### Request Presigned Upload URL (Path B — Large Files)

For files > 100MB. Client uploads directly to MinIO.

```
POST /artifacts/upload-url
Content-Type: application/json
```

```json
{
    "metadata": {
        "title": "Full Documentary Recording",
        "creator": "Archive Team"
    },
    "filename": "documentary.mp4",
    "content_type": "video/mp4",
    "size_bytes": 5368709120
}
```

Response `201`:
```json
{
    "artifact_id": "6617abc123def456",
    "upload_url": "http://minio:9000/artifacts/...?X-Amz-Signature=...",
    "expires_at": "2025-04-10T13:00:00Z"
}
```

Then upload to the presigned URL using PUT, and confirm:

### Confirm Presigned Upload

```
POST /artifacts/{id}/confirm-upload
```

Response `200`: Same shape as the ingest response (`IngestionResponse`).

### Get Artifact

```
GET /artifacts/{id}
```

Response `200`:
```json
{
    "artifact_id": "6617abc123def456",
    "title": "Interview with John Doe",
    "description": "...",
    "creator": "Jane Smith",
    "creation_date": "1965-03-15",
    "type": "video",
    "format": "mp4",
    "language": ["en"],
    "subject": ["civil rights"],
    "rights": "CC BY-NC 4.0",
    "status": "ready",
    "original_filename": "interview.mp4",
    "file_extension": ".mp4",
    "mime_type": "video/mp4",
    "size_bytes": 104857600,
    "uploaded_at": "2025-04-10T12:00:00Z",
    "storage_locations": [...],
    "preservation_events": [...],
    "fixity": {...},
    "processing_metadata": {...}
}
```

### Get Artifact Status

Polling endpoint for tracking processing progress.

```
GET /artifacts/{id}/status
```

Response `200`:
```json
{
    "artifact_id": "6617abc123def456",
    "status": "processing",
    "detail": null,
    "updated_at": "2025-04-10T12:01:00Z"
}
```

### List Artifacts

```
GET /artifacts?status=ready&limit=50&skip=0&type=video
```

Query parameters (all optional):
- `status` — Filter by status: `uploading`, `processing`, `ready`, `failed`, `archived`
- `type` — Filter by artifact type
- `limit` — Page size (1-100, default 50)
- `skip` — Offset for pagination

Response `200`:
```json
{
    "artifacts": [
        {
            "artifact_id": "6617abc123def456",
            "title": "Interview with John Doe",
            "status": "ready",
            "type": "video",
            "size_bytes": 104857600,
            "uploaded_at": "2025-04-10T12:00:00Z"
        }
    ],
    "total": 42
}
```

## Preservation

### Get Preservation Events

PREMIS-compliant audit trail for an artifact.

```
GET /preservation/artifacts/{id}/events
```

Response `200`:
```json
{
    "artifact_id": "6617abc123def456",
    "events": [
        {
            "event_type": "ingestion",
            "timestamp": "2025-04-10T12:00:00Z",
            "agent": "api",
            "outcome": "success",
            "detail": "Artifact ingested to storage path: artifacts/2025/04/6617.../interview.mp4"
        }
    ]
}
```

### Get Storage Locations

```
GET /preservation/artifacts/{id}/storage-locations
```

Response `200`:
```json
{
    "artifact_id": "6617abc123def456",
    "storage_locations": [
        {
            "storage_type": "hot",
            "path": "artifacts/2025/04/6617.../interview.mp4",
            "checksum_md5": "d41d8cd98f00b204e9800998ecf8427e",
            "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
            "size_bytes": 104857600,
            "stored_at": "2025-04-10T12:00:00Z"
        }
    ],
    "total_copies": 1
}
```

### Get Fixity Info

```
GET /preservation/artifacts/{id}/fixity
```

Response `200`:
```json
{
    "artifact_id": "6617abc123def456",
    "fixity": {
        "checksum_md5": "d41d8cd98f00b204e9800998ecf8427e",
        "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
        "algorithm": "md5,sha256",
        "calculated_at": "2025-04-10T12:00:00Z"
    }
}
```

### Trigger Replication

```
POST /preservation/artifacts/{id}/replicate
```

Response `501`: Not yet implemented (Phase 4).

## Collections

All collection endpoints currently return `503` — requires Globus configuration (Phase 4).

```
POST /collections/draft
POST /collections/{id}/finalize
GET  /collections/{id}
GET  /collections
```

## Internal

### Pipeline Callback

Receives task results from pipeline workers. Authenticated with a shared secret.

```
POST /internal/pipeline/callback
Authorization: Bearer {PIPELINE_CALLBACK_SECRET}
Content-Type: application/json
```

See [Pipeline docs](pipeline.md) for the full callback protocol.

### Health Check

```
GET /health
```

Response `200`:
```json
{
    "status": "healthy",
    "environment": "development"
}
```

## Error Responses

All errors return JSON with a `detail` field:

```json
{
    "detail": "Artifact not found"
}
```

HTTP status codes:
- `400` — Bad request (missing fields, invalid input)
- `401` — Unauthorized (invalid callback secret)
- `404` — Resource not found
- `500` — Internal server error
- `501` — Not implemented
- `503` — Service unavailable (collection endpoints before Globus config)
