import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("mediassist.ai.smart_engine")

MAX_FOLLOW_UP_QUESTIONS_PER_TOPIC = 5
MAX_CLARIFICATION_ATTEMPTS = 2

CLINICAL_INTENT_PATTERNS = {
    "symptom_onset": [
        r"when did", r"kab से", r"kab se", r"how long", r"since when", r"when started",
        r"kab shuru", r"starting time", r"shuru hua"
    ],
    "symptom_location": [
        r"where is", r"where does", r"which part", r"kahan", r"kis hisse", r"which area",
        r"location", r"kis taraf", r"where exact"
    ],
    "symptom_severity": [
        r"how severe", r"how bad", r"kitna", r"severity", r"mild", r"moderate", r"severe",
        r"scale of 1", r"tez", r"halka"
    ],
    "symptom_character": [
        r"what kind", r"type of pain", r"kaisa dard", r"throbbing", r"sharp", r"dull",
        r"burning", r"heavy"
    ],
    "associated_symptoms": [
        r"anything else", r"other symptoms", r"nausea", r"vomiting", r"fever", r"dizziness",
        r"aur kuch", r"koi aur takleef", r"light sensitivity"
    ],
    "triggers_context": [
        r"what were you doing", r"any trigger", r"screen time", r"studying", r"stress",
        r"kya kar rahe the", r"wajah"
    ]
}

CASUAL_TRIGGERS = [
    "hello", "hi", "hey", "how are you", "kaise ho", "kya haal hai", "good morning",
    "good evening", "roommate", "friend", "weather", "bored", "boredom", "joke", "tell me something funny",
    "sex", "relationship", "feeling sad", "frustrated"
]

SYMPTOM_TRIGGERS = [
    "headache", "sar dard", "sir dard", "pain", "fever", "bukhar", "cough", "khansi",
    "vomiting", "ulti", "nausea", "dizziness", "chakkar", "stomach", "pet dard",
    "sore throat", "gale me dard", "chest pain", "rash", "migraine", "sick", "unwell",
    "takleef", "bimar", "hurt", "hurting"
]

class SmartQuestionEngine:
    """
    Smart Question Engine & Conversation State Machine.
    Fixes repetitive questioning and infinite loops by tracking:
    - Answered Information
    - Question Intent History
    - Clarification Limits
    - Follow-Up Limits
    - Casual vs Health mode
    - Topic switching & returning
    """

    def initialize_session_state(self) -> Dict[str, Any]:
        return {
            "current_topic": "general",
            "previous_topic": None,
            "conversation_mode": "CASUAL",
            "answered_information": {},
            "questions_asked": [],  # list of {"question": str, "intent": str, "turn": int}
            "unresolved_information": ["symptom_onset", "symptom_location", "symptom_severity", "associated_symptoms"],
            "follow_up_count": 0,
            "clarification_attempts": {},  # intent -> int
            "topic_history": {}  # topic -> answered_information dict
        }

    def detect_conversation_mode(
        self,
        user_text: str,
        current_state: Dict[str, Any]
    ) -> Tuple[str, str]:
        """
        Determines (conversation_mode, current_topic).
        """
        text_lower = user_text.lower().strip()
        mode = current_state.get("conversation_mode", "CASUAL")
        topic = current_state.get("current_topic", "general")

        # Check explicit topic switch to casual
        if any(t in text_lower for t in ["forget it", "leave it", "let's chat", "tell me something funny", "change topic", "kuch aur baat"]):
            return "CASUAL", "casual"

        # Check explicit topic return to health
        if any(t in text_lower for t in ["back to my headache", "headache is still", "my symptoms again", "actually my pain"]):
            prev_topic = current_state.get("previous_topic") or "symptoms"
            return "HEALTH_CONSULTATION", prev_topic

        # Check if user mentioned explicit symptoms
        has_symptoms = any(s in text_lower for s in SYMPTOM_TRIGGERS)
        if has_symptoms:
            # Determine specific symptom topic
            if "headache" in text_lower or "sar dard" in text_lower or "sir dard" in text_lower or "migraine" in text_lower:
                topic = "headache"
            elif "fever" in text_lower or "bukhar" in text_lower:
                topic = "fever"
            elif "stomach" in text_lower or "pet" in text_lower:
                topic = "abdominal_pain"
            else:
                topic = "general_symptoms"
            return "HEALTH_CONSULTATION", topic

        # If already in HEALTH_CONSULTATION and user is providing clinical answers (numbers, durations, locations)
        if mode == "HEALTH_CONSULTATION":
            clinical_terms = ["hours", "ghante", "morning", "subah", "front", "head", "sir", "moderate", "mild", "severe", "din", "yesterday", "kal"]
            if any(term in text_lower for term in clinical_terms):
                return "HEALTH_CONSULTATION", topic

        # Check casual triggers
        if any(c in text_lower for c in CASUAL_TRIGGERS) and not has_symptoms:
            return "CASUAL", "casual"

        return mode, topic

    def extract_facts_from_utterance(
        self,
        user_text: str,
        current_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extracts facts from utterance, including multi-fact extraction in a single answer.
        E.g.: "Subah se headache hai front side mein, moderate pain."
        -> onset="morning", location="frontal", severity="moderate", chief_complaint="headache"
        """
        text = user_text.lower()
        ans_info = current_state.get("answered_information", {})

        # Chief complaint
        if "chief_complaint" not in ans_info:
            for symptom, std_name in [
                ("headache", "headache"), ("sar dard", "headache"), ("sir dard", "headache"), ("migraine", "headache"),
                ("fever", "fever"), ("bukhar", "fever"), ("stomach", "abdominal pain"), ("pet dard", "abdominal pain"),
                ("sore throat", "sore throat"), ("gale me dard", "sore throat")
            ]:
                if symptom in text:
                    ans_info["chief_complaint"] = std_name
                    break

        # Onset / Duration
        if "onset" not in ans_info:
            if any(w in text for w in ["subah se", "this morning", "morning"]):
                ans_info["onset"] = "this morning"
            elif any(w in text for w in ["kal se", "yesterday"]):
                ans_info["onset"] = "yesterday"
            elif any(w in text for w in ["4 hours", "4 ghante", "four hours"]):
                ans_info["onset"] = "4 hours ago"
            elif any(w in text for w in ["2 days", "2 din"]):
                ans_info["onset"] = "2 days ago"

        # Location
        if "location" not in ans_info:
            if any(w in text for w in ["front", "forehead", "front part", "front side", "aage"]):
                ans_info["location"] = "frontal region / forehead"
            elif any(w in text for w in ["temple", "left side", "right side", "back of head", "piche"]):
                ans_info["location"] = "temples / side of head"
            elif any(w in text for w in ["in my head", "head", "sir me"]):
                ans_info["location"] = "head region"

        # Severity
        if "severity" not in ans_info:
            if any(w in text for w in ["moderate", "beech ka", "medium"]):
                ans_info["severity"] = "moderate"
            elif any(w in text for w in ["severe", "bohot tez", "bohot zyada", "bad"]):
                ans_info["severity"] = "severe"
            elif any(w in text for w in ["mild", "halka", "thoda"]):
                ans_info["severity"] = "mild"
            else:
                sev_match = re.search(r'\b([1-9]|10)\s*(?:/|\s*out of\s*)?\s*10\b', text)
                if sev_match:
                    ans_info["severity"] = f"{sev_match.group(1)}/10"

        # Context / Triggers
        if "triggers_context" not in ans_info:
            if any(w in text for w in ["padhai", "studying", "study", "screen", "laptop", "mobile", "exam"]):
                ans_info["triggers_context"] = "long study hours / screen time"

        # Associated Symptoms
        assoc = ans_info.get("associated_symptoms", [])
        for s in ["nausea", "vomiting", "ulti", "dizziness", "chakkar", "fever", "eye strain"]:
            if s in text and s not in assoc:
                assoc.append(s)
        if assoc:
            ans_info["associated_symptoms"] = assoc

        # Check negative associated symptoms ("no", "nahi", "nothing else")
        if any(w in text for w in ["no", "nahi", "nothing else", "aur kuch nahi", "none"]):
            ans_info["associated_symptoms_denied"] = True

        current_state["answered_information"] = ans_info
        return current_state

    def classify_question_intent(self, question_text: str) -> str:
        """
        Classifies the primary clinical intent of a candidate follow-up question.
        """
        q_lower = question_text.lower()
        for intent, patterns in CLINICAL_INTENT_PATTERNS.items():
            for p in patterns:
                if re.search(p, q_lower):
                    return intent
        return "general_clinical_query"

    def is_question_allowed(
        self,
        candidate_question: str,
        current_state: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """
        Question Repetition Guard:
        Checks if candidate question has already been answered, already been asked,
        exceeds clarification limits, or exceeds max follow-up count.
        """
        ans_info = current_state.get("answered_information", {})
        asked_questions = current_state.get("questions_asked", [])
        follow_up_count = current_state.get("follow_up_count", 0)
        clarification_attempts = current_state.get("clarification_attempts", {})

        # Rule 1: Max follow-up limit check
        if follow_up_count >= MAX_FOLLOW_UP_QUESTIONS_PER_TOPIC:
            return False, "MAX_FOLLOW_UP_REACHED"

        intent = self.classify_question_intent(candidate_question)

        # Rule 2: Intent already answered check
        if intent == "symptom_onset" and "onset" in ans_info:
            return False, "INTENT_ALREADY_ANSWERED (onset)"
        if intent == "symptom_location" and "location" in ans_info:
            return False, "INTENT_ALREADY_ANSWERED (location)"
        if intent == "symptom_severity" and "severity" in ans_info:
            return False, "INTENT_ALREADY_ANSWERED (severity)"
        if intent == "symptom_character" and "character" in ans_info:
            return False, "INTENT_ALREADY_ANSWERED (character)"
        if intent == "triggers_context" and "triggers_context" in ans_info:
            return False, "INTENT_ALREADY_ANSWERED (triggers_context)"
        if intent == "associated_symptoms" and ("associated_symptoms" in ans_info or ans_info.get("associated_symptoms_denied")):
            return False, "INTENT_ALREADY_ANSWERED (associated_symptoms)"

        # Rule 3: Intent already asked check
        for q in asked_questions:
            if q.get("intent") == intent and intent != "general_clinical_query":
                return False, f"INTENT_ALREADY_ASKED ({intent})"

        # Rule 4: Semantic question duplicate check
        c_words = set(re.findall(r'\w+', candidate_question.lower()))
        for q in asked_questions:
            q_text = q.get("question", "").lower()
            q_words = set(re.findall(r'\w+', q_text))
            intersection = c_words.intersection(q_words)
            # If 3+ meaningful words match
            meaningful_common = [w for w in intersection if w not in ["is", "the", "a", "an", "you", "your", "what", "how", "where", "when", "in", "of", "to"]]
            if len(meaningful_common) >= 3:
                return False, "SEMANTIC_DUPLICATE_QUESTION"

        return True, "ALLOWED"

    def record_asked_question(
        self,
        question_text: str,
        current_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        intent = self.classify_question_intent(question_text)
        asked = current_state.get("questions_asked", [])
        asked.append({
            "question": question_text,
            "intent": intent,
            "turn": len(asked) + 1,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        current_state["questions_asked"] = asked
        current_state["follow_up_count"] = current_state.get("follow_up_count", 0) + 1

        clar_attempts = current_state.get("clarification_attempts", {})
        clar_attempts[intent] = clar_attempts.get(intent, 0) + 1
        current_state["clarification_attempts"] = clar_attempts
        return current_state

    def should_stop_questioning(self, current_state: Dict[str, Any]) -> bool:
        """
        Determines if enough information has been gathered to move to guidance.
        """
        ans_info = current_state.get("answered_information", {})
        follow_up_count = current_state.get("follow_up_count", 0)

        if follow_up_count >= MAX_FOLLOW_UP_QUESTIONS_PER_TOPIC:
            return True

        # If chief complaint + 2 key dimensions (onset, location/severity/triggers) are known
        known_count = 0
        if "chief_complaint" in ans_info:
            known_count += 1
        if "onset" in ans_info:
            known_count += 1
        if "location" in ans_info:
            known_count += 1
        if "severity" in ans_info:
            known_count += 1
        if "triggers_context" in ans_info:
            known_count += 1
        if "associated_symptoms" in ans_info or ans_info.get("associated_symptoms_denied"):
            known_count += 1

        if known_count >= 4 or (known_count >= 3 and follow_up_count >= 3):
            return True

        return False

smart_question_engine = SmartQuestionEngine()
