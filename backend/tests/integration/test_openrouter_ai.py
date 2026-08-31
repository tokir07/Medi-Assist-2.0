import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from app.services.ai.openrouter_service import OpenRouterClinicalAIService
from app.services.ai.safety_rules import safety_scanner

SKIP_REASON = "OPENROUTER_API_KEY not set. Skipping live OpenRouter integration tests."

@pytest.mark.skipif(not os.environ.get("OPENROUTER_API_KEY"), reason=SKIP_REASON)
def test_live_openrouter_next_question():
    service = OpenRouterClinicalAIService()
    res = service.determine_next_question(
        chief_complaint="Headache",
        answered_questions=[{"question_id": "duration", "answer_text": "Started yesterday evening."}],
        language="en"
    )
    assert res is not None
    assert "question" in res
    assert len(res["question"]) > 5

@pytest.mark.skipif(not os.environ.get("OPENROUTER_API_KEY"), reason=SKIP_REASON)
def test_live_openrouter_red_flag_detection():
    service = OpenRouterClinicalAIService()
    res = service.detect_red_flags(
        chief_complaint="Chest Pain",
        answers=[{"question_id": "character", "answer_text": "Heavy pressure radiating to left arm with shortness of breath."}]
    )
    assert res is not None
    assert res["detected"] is True
    assert res["severity"] in ["HIGH", "CRITICAL"]

def test_deterministic_safety_scanner_rule():
    res = safety_scanner.scan_emergency_triggers(
        chief_complaint="Headache",
        answers=[{"question_id": "severity", "answer_text": "This is the worst headache of my life, sudden onset."}]
    )
    assert res is not None
    assert res["detected"] is True
    assert res["category"] == "NEURO_RED_FLAG"
