import os
import base64
import tempfile
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger("mediassist.voice")

class BaseSpeechToTextService(ABC):
    @abstractmethod
    def transcribe(self, audio_bytes: bytes, filename: str = "audio.m4a", language: str = "en") -> Dict[str, Any]:
        pass

class MockSpeechToTextService(BaseSpeechToTextService):
    """
    Mock STT service for isolated automated test runs ONLY.
    """
    def transcribe(self, audio_bytes: bytes, filename: str = "audio.m4a", language: str = "en") -> Dict[str, Any]:
        return {
            "transcript": "It started yesterday evening and feels mostly in the front of my head.",
            "confidence": 0.96,
            "language": language,
            "duration_seconds": 3.5
        }

class OpenAISpeechToTextService(BaseSpeechToTextService):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = base_url or (settings.STT_BASE_URL if settings.STT_BASE_URL else None)
        self.model = model or settings.STT_MODEL or "whisper-1"

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.m4a", language: str = "en") -> Dict[str, Any]:
        if not self.api_key:
            logger.error("STT provider configuration error: OPENAI_API_KEY is not configured")
            raise AppException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Speech transcription service is not configured. Please set OPENAI_API_KEY in backend environment."
            )

        if not audio_bytes or len(audio_bytes) == 0:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Audio file is empty or corrupted."
            )

        client_kwargs: Dict[str, Any] = {"api_key": self.api_key}
        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        client = OpenAI(**client_kwargs)

        # Determine file suffix from filename or default to .m4a
        ext = os.path.splitext(filename)[1].lower() if filename else ".m4a"
        if not ext or ext not in [".m4a", ".wav", ".mp3", ".ogg", ".webm", ".aac", ".flac", ".mp4", ".caf"]:
            ext = ".m4a"

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_audio.flush()
                temp_path = temp_audio.name

            lang_param = language if language and language in ["en", "hi", "es", "fr", "de", "ar", "zh"] else None

            with open(temp_path, "rb") as f:
                transcript_res = client.audio.transcriptions.create(
                    model=self.model,
                    file=f,
                    language=lang_param
                )

            raw_text = transcript_res.text if hasattr(transcript_res, "text") else str(transcript_res)
            return {
                "transcript": raw_text.strip() if raw_text else "",
                "confidence": 0.98,
                "language": language,
                "duration_seconds": None
            }
        except AppException:
            raise
        except Exception as e:
            logger.error(f"OpenAI STT Transcription failed: {str(e)}")
            raise AppException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                message=f"Speech transcription provider error: {str(e)}"
            )
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to delete temp audio file {temp_path}: {cleanup_err}")

class GroqSpeechToTextService(OpenAISpeechToTextService):
    def __init__(self):
        super().__init__(
            api_key=settings.GROQ_API_KEY or settings.OPENAI_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            model="whisper-large-v3"
        )

class MockTextToSpeechService:
    def synthesize(self, text: str, language: str = "en", voice: str = "Aarav") -> Dict[str, Any]:
        return {
            "audio_url": f"https://api.mediassist.local/audio/preview?voice={voice}&lang={language}",
            "text": text,
            "voice": voice
        }

class OpenAITextToSpeechService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.TTS_MODEL or "tts-1"

    def synthesize(self, text: str, language: str = "en", voice: str = "alloy") -> Dict[str, Any]:
        if not self.api_key:
            return MockTextToSpeechService().synthesize(text, language, voice)

        try:
            client = OpenAI(api_key=self.api_key)
            voice_mapped = "alloy" if voice not in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else voice

            response = client.audio.speech.create(
                model=self.model,
                voice=voice_mapped,
                input=text
            )

            audio_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "audio_base64": audio_base64,
                "text": text,
                "voice": voice_mapped
            }
        except Exception as e:
            logger.error(f"OpenAI TTS Synthesis failed: {str(e)}")
            return MockTextToSpeechService().synthesize(text, language, voice)

def get_stt_service() -> BaseSpeechToTextService:
    provider = (settings.STT_PROVIDER or "openai").lower().strip()
    if provider == "openai":
        return OpenAISpeechToTextService()
    elif provider == "groq":
        return GroqSpeechToTextService()
    elif provider == "mock":
        return MockSpeechToTextService()
    raise AppException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message=f"Unsupported STT_PROVIDER '{provider}'. Supported providers: openai, groq, mock."
    )

def get_tts_service():
    provider = (settings.TTS_PROVIDER or "mock").lower()
    if provider == "openai":
        return OpenAITextToSpeechService()
    return MockTextToSpeechService()

class STTProxy:
    def transcribe(self, audio_bytes: bytes, filename: str = "audio.m4a", language: str = "en") -> Dict[str, Any]:
        return get_stt_service().transcribe(audio_bytes=audio_bytes, filename=filename, language=language)

class TTSProxy:
    def synthesize(self, text: str, language: str = "en", voice: str = "alloy"):
        return get_tts_service().synthesize(text, language, voice)

stt_service = STTProxy()
tts_service = TTSProxy()

