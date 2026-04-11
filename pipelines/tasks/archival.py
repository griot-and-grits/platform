"""Archival task — copy artifact from hot storage to cold/archive storage."""

import logging
from pathlib import Path

from minio import Minio
from minio.commonconfig import CopySource

from config import Config

logger = logging.getLogger(__name__)


class ArchivalTask:
    """Copy an artifact from the hot bucket to the archive bucket."""

    def __init__(self, minio_client: Minio):
        self.minio = minio_client
        self.archive_bucket = Config.ARCHIVE_BUCKET

    def run(self, artifact_id: str, bucket: str, storage_path: str) -> dict:
        """Copy object from source bucket to archive bucket, return new location."""
        # Archive path mirrors the hot storage path structure.
        archive_path = storage_path.replace("artifacts/", "archive/", 1)

        logger.info(
            "Archiving %s/%s → %s/%s",
            bucket, storage_path,
            self.archive_bucket, archive_path,
        )

        # Server-side copy — no data goes through the worker.
        self.minio.copy_object(
            self.archive_bucket,
            archive_path,
            CopySource(bucket, storage_path),
        )

        # Stat the archived object to get size for the storage location record.
        stat = self.minio.stat_object(self.archive_bucket, archive_path)

        logger.info("Archived %s to %s/%s (%d bytes)", artifact_id, self.archive_bucket, archive_path, stat.size)

        return {
            "storage_type": "archive",
            "path": archive_path,
            "bucket": self.archive_bucket,
            "size_bytes": stat.size,
            "checksum_md5": stat.etag,
        }
