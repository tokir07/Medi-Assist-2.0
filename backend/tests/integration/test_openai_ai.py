import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from app.services.ai.openai_service import OpenAIClinicalAIService
from app.services.ai.safety_rules import safety_scanner
from app.services.voice_service import OpenAISpeechToTextService, OpenAITextToSpeechService

SKIP_REASON = "OPENAI_API_KEY not set. Skipping live OpenAI integration tests."

@pytest.mark.skipif(not os.environ.get("OPENAI_API_KEY"), reason=SKIP_REASON)
def test_live_openai_next_question():
    service = OpenAIClinicalAIService()
    res = service.determine_next_question(
        chief_complaint="Headache",
        answered_questions=[{"question_id": "duration", "answer_text": "Started yesterday evening."}],
        language="en"
    )
    assert res is not None
    assert "question" in res
    assert len(res["question"]) > 5

@pytest.mark.skipif(not os.environ.get("OPENAI_API_KEY"), reason=SKIP_REASON)
def test_live_openai_red_flag_detection():
    service = OpenAIClinicalAIService()
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
