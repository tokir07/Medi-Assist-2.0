from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseClinicalAIService(ABC):
    @abstractmethod
    def determine_next_question(
        self,
        chief_complaint: str,
        answered_questions: List[Dict[str, Any]],
        language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def detect_red_flags(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def generate_hpi_summary(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]],
        language: str = "en"
    ) -> str:
        pass
