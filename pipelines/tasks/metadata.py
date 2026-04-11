"""Metadata extraction task using FFmpeg/ffprobe."""

import json
import logging
import os
import subprocess
from pathlib import Path

from minio import Minio

from config import Config

logger = logging.getLogger(__name__)


class MetadataExtractionTask:
    """Extract technical metadata from media files using ffprobe."""

    def __init__(self, minio_client: Minio):
        self.minio = minio_client
        self.temp_dir = Path(Config.TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def run(self, artifact_id: str, bucket: str, storage_path: str) -> dict:
        """Download file, run ffprobe, return extracted metadata."""
        local_path = self.temp_dir / f"{artifact_id}_{Path(storage_path).name}"

        try:
            logger.info("Downloading %s/%s for metadata extraction", bucket, storage_path)
            self.minio.fget_object(bucket, storage_path, str(local_path))

            metadata = self._extract(str(local_path))
            logger.info("Metadata extracted for %s: %s", artifact_id, metadata)
            return metadata

        finally:
            if local_path.exists():
                local_path.unlink()

    def _extract(self, file_path: str) -> dict:
        """Run ffprobe and parse the output."""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            file_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise RuntimeError(f"ffprobe failed: {result.stderr}")

        probe = json.loads(result.stdout)
        fmt = probe.get("format", {})
        streams = probe.get("streams", [])

        metadata: dict = {
            "duration_seconds": float(fmt.get("duration", 0)),
            "file_size_bytes": int(fmt.get("size", 0)),
            "format_name": fmt.get("format_name"),
            "format_long_name": fmt.get("format_long_name"),
        }

        # Find video and audio streams.
        for stream in streams:
            codec_type = stream.get("codec_type")

            if codec_type == "video":
                metadata.update({
                    "video_codec": stream.get("codec_name"),
                    "width": stream.get("width"),
                    "height": stream.get("height"),
                    "frame_rate": _parse_frame_rate(stream.get("r_frame_rate", "0/1")),
                })

            elif codec_type == "audio":
                metadata.update({
                    "audio_codec": stream.get("codec_name"),
                    "channels": stream.get("channels"),
                    "sample_rate": stream.get("sample_rate"),
                })

        return metadata


def _parse_frame_rate(rate_str: str) -> float | None:
    """Parse ffprobe frame rate string like '30000/1001' to float."""
    try:
        num, den = rate_str.split("/")
        d = int(den)
        if d == 0:
            return None
        return round(int(num) / d, 2)
    except (ValueError, ZeroDivisionError):
        return None
