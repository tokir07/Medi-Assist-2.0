import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("mediassist.ai.controller")

# Natural empathy & acknowledgement variations (Banning robotic template loops)
NATURAL_ACKNOWLEDGEMENTS_EN = [
    "Got it.",
    "Understood.",
    "Okay, that helps me understand.",
    "Thanks, that gives me a clearer picture.",
    "I hear you.",
    "Noted."
]

NATURAL_ACKNOWLEDGEMENTS_HI = [
    "Samajh gaya.",
    "Theek hai, note kar liya.",
    "Achha, isse situation thodi clear hui.",
    "Yeh jaankari madad karegi.",
    "Theek hai, main samajh raha hoon."
]

# Filler / Incomplete speech tokens from Voice STT
INCOMPLETE_VOICE_TOKENS = {
    "just", "actually", "umm", "um", "uh", "hmm", "hm", "wait", "yeah", "yes",
    "nahi", "bas", "kuch nahi", "matlab", "aur", "toh", "like", "well", "okay so", "so"
}

class ConversationController:
    """
    Layer 2: Real-Time Conversation Controller & Current-Turn Intent Engine.
    Guarantees:
    1. The CURRENT turn always has 100% priority over previous conversation state.
    2. Dynamic topic switching without getting trapped in previous questionnaire loops.
    3. Dedicated handling for MEDICATION questions, CASUAL chat, APP HELP, and SAFETY.
    4. Voice STT ambiguity detection to prevent hallucinated diagnoses.
    5. Structured clinical state retention without repeating already answered questions.
    """

    def analyze_turn(
        self,
        current_message: str,
        structured_context: Dict[str, Any],
        recent_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        q = current_message.strip()
        q_lower = q.lower()
        is_hinglish = self.is_hinglish(q)

        # 1. Check for Ambiguous / Incomplete Voice Utterance
        if self._is_incomplete_utterance(q_lower):
            return {
                "intent": "AMBIGUOUS_INCOMPLETE",
                "mode": "CLARIFICATION",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 2. Check for Severe Emergency Red Flag
        if self._is_emergency_red_flag(q_lower):
            return {
                "intent": "EMERGENCY_RED_FLAG",
                "mode": "SAFETY",
                "is_hinglish": is_hinglish,
                "confidence": 1.0
            }

        # 3. Check for Violence / Self-Harm De-escalation
        if self._is_violence_or_harm(q_lower):
            return {
                "intent": "VIOLENCE_DEESCALATION",
                "mode": "SAFETY",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 4. Check for Direct Patient Database Queries (e.g. My Prescriptions, Appointments)
        db_intent = self._detect_db_query_intent(q_lower)
        if db_intent:
            return {
                "intent": db_intent,
                "mode": "DATA_QUERY",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 5. Check for General Medication Specific Advice / Inquiries
        if self._is_medication_question(q_lower):
            return {
                "intent": "MEDICATION_QUESTION",
                "mode": "MEDICATION",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 6. Check for App Navigation / Feature Guidance
        app_intent = self._detect_app_intent(q_lower)
        if app_intent:
            return {
                "intent": app_intent,
                "mode": "APP_ASSISTANCE",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 7. Check for Unclear / Ambiguous Medical Speech (e.g., "my friend is having the age")
        if self._is_ambiguous_medical_speech(q_lower):
            return {
                "intent": "CLARIFICATION_NEEDED",
                "mode": "CLARIFICATION",
                "is_hinglish": is_hinglish,
                "confidence": 0.90
            }

        # 8. Check for Explicit Topic Switch or End Consultation
        if self._is_topic_switch_to_casual(q_lower):
            return {
                "intent": "CASUAL_CONVERSATION",
                "mode": "CASUAL",
                "is_hinglish": is_hinglish,
                "confidence": 0.95
            }

        # 9. Check for Personal Health Symptoms
        if self._is_personal_health_concern(q_lower, structured_context):
            return {
                "intent": "PERSONAL_HEALTH_CONCERN",
                "mode": "HEALTH_CONSULTATION",
                "is_hinglish": is_hinglish,
                "confidence": 0.90
            }

        # 10. General / Casual / Emotional Conversation (Default)
        return {
            "intent": "GENERAL_CONVERSATION",
            "mode": "CASUAL",
            "is_hinglish": is_hinglish,
            "confidence": 0.85
        }

    def is_hinglish(self, text: str) -> bool:
        hinglish_keywords = [
            "kaise", "kya", "namaste", "kem cho", "mera", "meri", "mere", "mujhe",
            "hai", "hoon", "ho", "nahi", "kuch", "baat", "karni", "thi", "udas",
            "dard", "bukhar", "khansi", "ulti", "chakkar", "seene", "chhati", "saans",
            "dawai", "dawaiyan", "dawa", "bataiye", "aapka", "aapki", "theek", "shukriya",
            "bhai", "yaar", "sir dard", "sar dard", "padhai", "padhaai", "bataye"
        ]
        words = re.findall(r'\w+', text.lower())
        match_count = sum(1 for w in words if w in hinglish_keywords)
        return match_count >= 1

    def _is_incomplete_utterance(self, q: str) -> bool:
        words = [w for w in q.split() if w]
        if len(words) == 1 and words[0] in INCOMPLETE_VOICE_TOKENS:
            return True
        if q in ["just...", "umm", "uh", "hmm", "actually...", "kuch nahi", "bas", "aur..."]:
            return True
        return False

    def _is_emergency_red_flag(self, q: str) -> bool:
        triggers = [
            "severe chest pain", "can't breathe", "struggling to breathe", "shortness of breath",
            "chhati me dard", "seene me dard", "saans lene me dikkat", "saans phool",
            "coughing up blood", "loss of consciousness", "sudden numbness", "heart attack",
            "chest tightness", "severe allergic reaction", "anaphylaxis"
        ]
        return any(t in q for t in triggers)

    def _is_violence_or_harm(self, q: str) -> bool:
        triggers = [
            "want to hurt", "kill my", "kill him", "kill her", "stab", "punch my",
            "marna chahta", "marne ka mann", "gussa aa raha hai jaan se", "suicide", "end my life"
        ]
        return any(t in q for t in triggers)

    def _is_medication_question(self, q: str) -> bool:
        triggers = [
            "medicine", "medication", "which medicine", "what medicine", "what pill", "take medicine",
            "dawai", "dawa", "kaun si medicine", "kaun si dawai", "tablet", "painkiller",
            "paracetamol", "ibuprofen", "specific medicine", "specific dawai", "kya dawai lu"
        ]
        return any(t in q for t in triggers)

    def _detect_app_intent(self, q: str) -> Optional[str]:
        if any(k in q for k in [
            "change my profile", "update my profile", "edit my profile", "where is my profile",
            "change profile", "update profile", "my profile", "edit profile", "profile change", "profile kaise change"
        ]):
            return "PROFILE_HELP"

        if any(k in q for k in [
            "where can i see my appointments", "where are my appointments", "how do i book an appointment",
            "book appointment", "how to book appointment", "appointment kaise book"
        ]):
            return "APPOINTMENT_HELP"

        if any(k in q for k in [
            "where are my prescriptions", "where can i see my prescriptions", "where are prescriptions",
            "my prescription list", "prescriptions kahan hai"
        ]):
            return "PRESCRIPTION_HELP"

        if any(k in q for k in [
            "where are my records", "where are my medical records", "how do i upload",
            "upload record", "upload medical record", "how to upload", "reports kahan"
        ]):
            return "MEDICAL_RECORD_HELP"

        return None

    def _detect_db_query_intent(self, q: str) -> Optional[str]:
        if any(k in q for k in [
            "when is my next appointment", "when is my appointment", "tell me my next appointment",
            "my upcoming appointment", "appointment kab hai", "agla appointment"
        ]):
            return "APPOINTMENT_QUERY"

        if any(k in q for k in [
            "what medicines am i currently taking", "what medications am i currently taking",
            "what medicines am i taking", "what medications am i taking", "what pills am i on",
            "meri dawaiyan kya hai", "meri active dawai"
        ]):
            return "PRESCRIPTION_QUERY"

        if any(k in q for k in ["what is my name", "what is my dob", "my personal details", "mera naam kya hai"]):
            return "PATIENT_DATA_QUERY"

        return None

    def _is_ambiguous_medical_speech(self, q: str) -> bool:
        # Detect patterns where speech-to-text captured an ambiguous medical word without clear meaning
        ambiguous_phrases = [
            "having the age", "having an age", "having that thing", "got the thing",
            "kuch aisi bimari", "kuch problem hai par pata nahi", "having the disease of age"
        ]
        return any(p in q for p in ambiguous_phrases)

    def _is_topic_switch_to_casual(self, q: str) -> bool:
        triggers = [
            "end conversation", "stop consultation", "let's chat casual", "casual chat",
            "kuch aur baat", "koi aur topic", "leave it", "let it be", "waise", "by the way",
            "roommate", "friend", "study", "bored", "bored ho raha", "sex", "relationship"
        ]
        return any(t in q for t in triggers)

    def _is_personal_health_concern(self, q: str, structured_context: Dict[str, Any]) -> bool:
        symptom_triggers = [
            "i have a ", "i've had a ", "im having ", "i'm having ", "i feel sick",
            "i feel dizzy", "my throat", "my head", "my stomach", "my back", "my chest",
            "hurts", "hurting", "pain", "fever", "cough", "vomiting", "nausea",
            "headache", "dizziness", "migraine", "rash", "sore throat",
            "mujhe ", "sar dard", "sir dard", "sir me dard", "pet dard", "pet kharab",
            "bukhar", "khansi", "gale me dard", "ulti", "chakkar", "kamzori lag rahi", "dard ho raha"
        ]
        # Direct symptom trigger present
        if any(t in q for t in symptom_triggers):
            return True

        # If a consultation is actively in progress and the user is answering a specific clinical question
        chief = structured_context.get("chief_complaint", "unknown")
        if chief != "unknown":
            duration_triggers = ["hours", "days", "since", "kal se", "aaj se", "subah se", "ghante", "din"]
            location_triggers = ["front", "back", "forehead", "left", "right", "side", "temple", "pet", "sar", "sir", "gala"]
            severity_triggers = ["10", "mild", "severe", "moderate", "tez", "halka", "bohot"]
            context_triggers = ["padhai", "studying", "screen", "laptop", "mobile", "exhausted", "thak gaya"]

            if any(t in q for t in duration_triggers + location_triggers + severity_triggers + context_triggers):
                return True

        return False

conversation_controller = ConversationController()
