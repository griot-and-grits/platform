#!/bin/sh
set -e

echo "Waiting for MinIO..."
until mc alias set local http://minio:9000 "${MINIO_ROOT_USER:-minioadmin}" "${MINIO_ROOT_PASSWORD:-minioadmin}" >/dev/null 2>&1; do
  sleep 1
done

echo "Creating buckets..."
mc mb --ignore-existing local/artifacts
mc mb --ignore-existing local/archive

echo "MinIO initialized."
