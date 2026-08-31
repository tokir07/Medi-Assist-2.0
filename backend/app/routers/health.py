from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health & AI Status"])

@router.get("/v1/health/ai")
@router.get("/health/ai")
def get_ai_health():
    """
    Internal AI Gateway Provider Health Check.
    Returns provider configuration without exposing sensitive secrets.
    """
    is_openrouter = settings.AI_PROVIDER.lower() == "openrouter"
    is_configured = bool(settings.OPENROUTER_API_KEY and len(settings.OPENROUTER_API_KEY) > 5) if is_openrouter else True

    return {
        "provider": settings.AI_PROVIDER,
        "configured": is_configured,
        "base_url": settings.OPENROUTER_BASE_URL if is_openrouter else "local-mock",
        "model": settings.OPENROUTER_MODEL if is_openrouter else "mock-rules-engine",
        "stt_provider": settings.STT_PROVIDER,
        "tts_provider": settings.TTS_PROVIDER,
        "status": "available"
    }
