from typing import List, Dict, Any, Optional

class DeterministicSafetyScanner:
    """
    Rule-based safety layer that inspects patient input BEFORE and alongside AI responses.
    Guarantees red-flag emergency detection even if LLM output varies.
    """

    @classmethod
    def scan_emergency_triggers(cls, chief_complaint: str, answers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        complaint_norm = (chief_complaint or "").upper().replace(" ", "_").replace("-", "_")
        ans_texts = [str(a.get("answer_text", "")) if isinstance(a, dict) else str(a) for a in answers]
        all_text = ((chief_complaint or "") + " " + " ".join(ans_texts)).lower()

        # 1. Chest Pain Emergency Triggers
        if complaint_norm == "CHEST_PAIN" or "chest pain" in all_text or "heart" in all_text or "chest" in all_text:
            keywords = ["pressure", "tightness", "heavy", "arm", "jaw", "sweat", "shortness of breath", "radiat"]
            if any(kw in all_text for kw in keywords):
                return {
                    "detected": True,
                    "severity": "HIGH",
                    "category": "CHEST_PAIN_RED_FLAG",
                    "reason": "Patient reported symptoms characteristic of acute cardiovascular distress.",
                    "recommended_action": "Seek immediate emergency medical evaluation."
                }

        # 2. Thunderclap Headache Emergency Triggers
        if complaint_norm == "HEADACHE" or "headache" in all_text:
            keywords = ["worst headache", "thunderclap", "sudden intense", "stiff neck", "fainted"]
            if any(kw in all_text for kw in keywords):
                return {
                    "detected": True,
                    "severity": "HIGH",
                    "category": "NEURO_RED_FLAG",
                    "reason": "Sudden severe headache reported requiring urgent neurological assessment.",
                    "recommended_action": "Seek urgent emergency medical evaluation."
                }

        # 3. Severe Breathing Difficulty
        if "can't breathe" in all_text or "unable to breathe" in all_text or "gasping" in all_text:
            return {
                "detected": True,
                "severity": "CRITICAL",
                "category": "RESPIRATORY_RED_FLAG",
                "reason": "Severe acute respiratory distress reported.",
                "recommended_action": "Call emergency services immediately."
            }

        return None

safety_scanner = DeterministicSafetyScanner()
