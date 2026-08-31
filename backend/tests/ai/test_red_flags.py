import sys
import os
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.ai.safety_rules import safety_scanner

def test_cardiovascular_emergency_red_flag_detection():
    res = safety_scanner.scan_emergency_triggers(
        chief_complaint="Chest Pain",
        answers=[{"question_id": "character", "answer_text": "Heavy pressure radiating to left arm with shortness of breath."}]
    )
    assert res is not None
    assert res["detected"] is True
    assert res["severity"] in ["HIGH", "CRITICAL"]
    assert res["category"] == "CHEST_PAIN_RED_FLAG"

def test_thunderclap_headache_emergency_red_flag_detection():
    res = safety_scanner.scan_emergency_triggers(
        chief_complaint="Headache",
        answers=[{"question_id": "severity", "answer_text": "This is the worst headache of my life, sudden onset."}]
    )
    assert res is not None
    assert res["detected"] is True
    assert res["category"] == "NEURO_RED_FLAG"

def test_false_positive_benign_headache_safety():
    res = safety_scanner.scan_emergency_triggers(
        chief_complaint="Headache",
        answers=[{"question_id": "severity", "answer_text": "Mild headache after studying, 2/10 pain."}]
    )
    assert res is None, "False positive detected: benign headache incorrectly flagged as emergency"
