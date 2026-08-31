from typing import List, Dict, Any, Optional
from app.services.ai.base import BaseClinicalAIService
from app.services.ai.safety_rules import safety_scanner

class MockClinicalAIService(BaseClinicalAIService):
    CLINICAL_PATHWAYS = {
        "HEADACHE": [
            {
                "question": "How long have you been experiencing this headache?",
                "type": "SINGLE_CHOICE",
                "options": ["Just started (Less than 2 hours)", "1 to 2 days", "3 to 7 days", "More than a week"],
                "key": "duration"
            },
            {
                "question": "Where is the pain located primarily?",
                "type": "SINGLE_CHOICE",
                "options": ["Front of Head", "Back of Head", "One Side (Left)", "One Side (Right)", "Whole Head"],
                "key": "location"
            },
            {
                "question": "How would you describe the intensity of the pain?",
                "type": "SINGLE_CHOICE",
                "options": ["Mild (Noticeable but easy to ignore)", "Moderate (Interferes with daily tasks)", "Severe (Intense & disabling)", "Worst headache of my life"],
                "key": "severity"
            },
            {
                "question": "Are you experiencing any associated symptoms such as nausea, vomiting, or vision changes?",
                "type": "YES_NO",
                "options": ["Yes", "No"],
                "key": "associated_symptoms"
            }
        ],
        "FEVER": [
            {
                "question": "What is your current estimated body temperature if measured?",
                "type": "SINGLE_CHOICE",
                "options": ["Mild (99°F - 100.4°F)", "Moderate (100.5°F - 102°F)", "High (Above 102°F)", "Not measured"],
                "key": "temperature"
            },
            {
                "question": "How many days have you had this fever?",
                "type": "SINGLE_CHOICE",
                "options": ["1 day", "2-3 days", "4-7 days", "More than a week"],
                "key": "duration"
            }
        ]
    }

    def determine_next_question(
        self,
        chief_complaint: str,
        answered_questions: List[Any],
        language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        complaint_upper = chief_complaint.upper()
        pathway = self.CLINICAL_PATHWAYS.get(complaint_upper)
        if not pathway:
            pathway = [
                {
                    "question": f"When did you first notice the {chief_complaint.lower()}?",
                    "type": "SINGLE_CHOICE",
                    "options": ["Today", "1-2 days ago", "This week", "More than a week ago"],
                    "key": "duration"
                },
                {
                    "question": "How severe are your symptoms right now?",
                    "type": "SINGLE_CHOICE",
                    "options": ["Mild", "Moderate", "Severe"],
                    "key": "severity"
                }
            ]

        answered_keys = [q.get("question_id") if isinstance(q, dict) else str(q) for q in answered_questions]
        for q_item in pathway:
            if q_item["key"] not in answered_keys:
                return q_item

        return None

    def detect_red_flags(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        return safety_scanner.scan_emergency_triggers(chief_complaint, answers)

    def generate_hpi_summary(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]],
        language: str = "en"
    ) -> str:
        parts = [f"Patient presents with chief complaint of {chief_complaint}."]
        for ans in answers:
            if isinstance(ans, dict):
                parts.append(f"{ans.get('answer_text')}")
            else:
                parts.append(str(ans))
        return " ".join(parts)
