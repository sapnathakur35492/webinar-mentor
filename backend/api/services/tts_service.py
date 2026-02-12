from __future__ import annotations

from typing import Optional

from core.settings import settings


class TTSService:
    """
    Instant preview audio generation using OpenAI TTS.
    This is meant to be FAST (seconds) and does not involve HeyGen.
    """

    def __init__(self) -> None:
        self.default_model = "tts-1"
        # More feminine-sounding default for the preview
        self.default_voice = "shimmer"

    def synthesize_mp3(self, text: str, *, voice: Optional[str] = None, speed: float = 1.0) -> bytes:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set")
        if not text or not text.strip():
            raise ValueError("Text is empty")

        # Keep it short for speed and cost
        text = text.strip()
        if len(text) > 1200:
            text = text[:1200]

        # OpenAI python client (already in requirements)
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        resp = client.audio.speech.create(
            model=self.default_model,
            voice=voice or self.default_voice,
            input=text,
            response_format="mp3",
            speed=speed,
        )

        # `resp` can be a binary response wrapper; `.read()` is supported in openai-python 1.x
        try:
            return resp.read()
        except Exception:
            # fallback: some versions expose `content`
            return getattr(resp, "content", b"")


tts_service = TTSService()

