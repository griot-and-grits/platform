"""Transcription task using Whisper API."""

import logging
import subprocess
from pathlib import Path

import httpx
from minio import Minio

from config import Config

logger = logging.getLogger(__name__)


class TranscriptionTask:
    """Transcribe audio/video using an external Whisper ASR service."""

    def __init__(self, minio_client: Minio):
        self.minio = minio_client
        self.temp_dir = Path(Config.TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.api_url = Config.TRANSCRIPTION_API_URL

    def run(self, artifact_id: str, bucket: str, storage_path: str) -> dict:
        """Download file, extract audio if needed, send to Whisper, return transcript."""
        local_path = self.temp_dir / f"{artifact_id}_{Path(storage_path).name}"
        audio_path = self.temp_dir / f"{artifact_id}_audio.wav"

        try:
            logger.info("Downloading %s/%s for transcription", bucket, storage_path)
            self.minio.fget_object(bucket, storage_path, str(local_path))

            # Extract audio to WAV for transcription.
            self._extract_audio(str(local_path), str(audio_path))

            # Send to Whisper API.
            transcript = self._transcribe(str(audio_path))
            logger.info("Transcription complete for %s (%d chars)", artifact_id, len(transcript))

            return {"transcript": transcript}

        finally:
            for p in (local_path, audio_path):
                if p.exists():
                    p.unlink()

    def _extract_audio(self, input_path: str, output_path: str) -> None:
        """Extract audio track to WAV using FFmpeg."""
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-vn",                  # No video
            "-acodec", "pcm_s16le", # WAV PCM 16-bit
            "-ar", "16000",         # 16kHz sample rate (Whisper optimal)
            "-ac", "1",             # Mono
            "-y",                   # Overwrite
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr}")

    def _transcribe(self, audio_path: str) -> str:
        """Send audio to Whisper ASR API and return transcript text."""
        with open(audio_path, "rb") as f:
            files = {"audio_file": (Path(audio_path).name, f, "audio/wav")}
            params = {
                "encode": "true",
                "task": "transcribe",
                "language": "en",
                "output": "json",
            }

            with httpx.Client(timeout=600) as client:
                resp = client.post(
                    f"{self.api_url}/asr",
                    files=files,
                    params=params,
                )
                resp.raise_for_status()

        data = resp.json()

        # Handle different Whisper API response formats.
        if isinstance(data, dict):
            return data.get("text", "")
        return str(data)
