"""Pipeline worker configuration from environment variables."""

import os


class Config:
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    QUEUE_KEY: str = os.getenv("QUEUE_KEY", "gng:pipeline:jobs")

    # Callback
    CALLBACK_URL: str = os.getenv("PIPELINE_CALLBACK_URL", "http://localhost:8009")
    CALLBACK_SECRET: str = os.getenv("PIPELINE_CALLBACK_SECRET", "dev-secret-change-me")
    CALLBACK_ENDPOINT: str = "/internal/pipeline/callback"

    # Storage (MinIO)
    STORAGE_ENDPOINT: str = os.getenv("STORAGE_ENDPOINT", "localhost:9000")
    STORAGE_ACCESS_KEY: str = os.getenv("STORAGE_ACCESS_KEY", "minioadmin")
    STORAGE_SECRET_KEY: str = os.getenv("STORAGE_SECRET_KEY", "minioadmin")
    STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "artifacts")
    STORAGE_SECURE: bool = os.getenv("STORAGE_SECURE", "false").lower() == "true"
    ARCHIVE_BUCKET: str = os.getenv("ARCHIVE_BUCKET", "archive")

    # Transcription
    TRANSCRIPTION_API_URL: str = os.getenv("TRANSCRIPTION_API_URL", "http://localhost:8080")

    # Worker
    TEMP_DIR: str = os.getenv("TEMP_DIR", "/tmp/pipeline")

    @classmethod
    def callback_url(cls) -> str:
        return f"{cls.CALLBACK_URL}{cls.CALLBACK_ENDPOINT}"
