import logging
from app.core.config import settings    
# pyrefly: ignore [missing-import]
from app.services.ai.base import BaseClinicalAIService
# pyrefly: ignore [missing-import]
from app.services.ai.openrouter_service import OpenRouterClinicalAIService
# pyrefly: ignore [missing-import]
from app.services.ai.mock_service import MockClinicalAIService

logger = logging.getLogger("mediassist.ai")

def get_clinical_ai_service() -> BaseClinicalAIService:
    provider = (settings.AI_PROVIDER or "mock").lower()
    if provider == "openrouter":
        logger.info(f"Using OpenRouter AI Gateway Service (model={settings.OPENROUTER_MODEL}, base_url={settings.OPENROUTER_BASE_URL})")
        return OpenRouterClinicalAIService()
    else:
        logger.info("Using Mock Clinical AI Service")
        return MockClinicalAIService()

class ClinicalAIServiceProxy(BaseClinicalAIService):
    """
    Proxy wrapper routing calls dynamically to OpenRouter or Mock service based on AI_PROVIDER setting.
    """
    def determine_next_question(self, chief_complaint: str, answered_questions, language: str = "en"):
        service = get_clinical_ai_service()
        return service.determine_next_question(chief_complaint, answered_questions, language)

    def detect_red_flags(self, chief_complaint: str, answers):
        service = get_clinical_ai_service()
        return service.detect_red_flags(chief_complaint, answers)

    def generate_hpi_summary(self, chief_complaint: str, answers, language: str = "en"):
        service = get_clinical_ai_service()
        return service.generate_hpi_summary(chief_complaint, answers, language)

clinical_ai_service = ClinicalAIServiceProxy()
