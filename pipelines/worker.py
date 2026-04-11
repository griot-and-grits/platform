"""Pipeline worker — consumes jobs from Redis and runs task chains.

Job format (JSON from Redis):
{
    "artifact_id": "abc123",
    "storage_bucket": "artifacts",
    "storage_path": "artifacts/2025/04/abc123/file.mp4",
    "callback_url": "http://api:8009",
    "tasks": ["metadata_extraction", "transcription", "archival"]
}

Each task posts its result to the Go API callback endpoint.
"""

import json
import logging
import signal
import sys

import httpx
import redis
from minio import Minio

from config import Config
from tasks import ArchivalTask, MetadataExtractionTask, TranscriptionTask

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("worker")

# Graceful shutdown flag.
_shutdown = False


def signal_handler(sig, frame):
    global _shutdown
    logger.info("Shutdown signal received, finishing current job...")
    _shutdown = True


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def create_minio_client() -> Minio:
    return Minio(
        Config.STORAGE_ENDPOINT,
        access_key=Config.STORAGE_ACCESS_KEY,
        secret_key=Config.STORAGE_SECRET_KEY,
        secure=Config.STORAGE_SECURE,
    )


def post_callback(artifact_id: str, task_name: str, status: str, result: dict | None, error: str | None) -> None:
    """POST task result to the Go API callback endpoint."""
    payload = {
        "artifact_id": artifact_id,
        "task": task_name,
        "status": status,
        "result": result,
        "error": error,
    }

    url = Config.callback_url()
    headers = {
        "Authorization": f"Bearer {Config.CALLBACK_SECRET}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info("Callback posted for %s/%s: %d", artifact_id, task_name, resp.status_code)
    except Exception as e:
        logger.error("Callback failed for %s/%s: %s", artifact_id, task_name, e)


def run_task(task_name: str, artifact_id: str, bucket: str, storage_path: str, minio_client: Minio) -> None:
    """Run a single task and post callback with results."""
    task_map = {
        "metadata_extraction": MetadataExtractionTask,
        "transcription": TranscriptionTask,
        "archival": ArchivalTask,
    }

    task_cls = task_map.get(task_name)
    if task_cls is None:
        logger.warning("Unknown task: %s", task_name)
        post_callback(artifact_id, task_name, "failure", None, f"Unknown task: {task_name}")
        return

    try:
        task = task_cls(minio_client)
        result = task.run(artifact_id, bucket, storage_path)
        post_callback(artifact_id, task_name, "success", result, None)
    except Exception as e:
        logger.exception("Task %s failed for %s", task_name, artifact_id)
        post_callback(artifact_id, task_name, "failure", None, str(e))


def process_job(job_data: dict, minio_client: Minio) -> None:
    """Process a single pipeline job — run all tasks sequentially."""
    artifact_id = job_data["artifact_id"]
    bucket = job_data["storage_bucket"]
    storage_path = job_data["storage_path"]
    tasks = job_data.get("tasks", [])

    logger.info("Processing job for artifact %s: %s", artifact_id, tasks)

    for task_name in tasks:
        run_task(task_name, artifact_id, bucket, storage_path, minio_client)


def main() -> None:
    logger.info("Pipeline worker starting...")
    logger.info("Redis: %s", Config.REDIS_URL)
    logger.info("Queue: %s", Config.QUEUE_KEY)
    logger.info("Callback: %s", Config.callback_url())

    r = redis.from_url(Config.REDIS_URL, decode_responses=True)
    minio_client = create_minio_client()

    logger.info("Worker ready, waiting for jobs...")

    while not _shutdown:
        # BLPOP blocks until a job is available (5s timeout to check shutdown).
        result = r.blpop(Config.QUEUE_KEY, timeout=5)
        if result is None:
            continue

        _, raw = result
        try:
            job_data = json.loads(raw)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in job: %s", raw[:200])
            continue

        process_job(job_data, minio_client)

    logger.info("Worker shut down.")


if __name__ == "__main__":
    main()
