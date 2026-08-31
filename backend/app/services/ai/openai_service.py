import logging
import time
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings
from app.services.ai.base import BaseClinicalAIService
from app.services.ai.prompts import CLINICAL_AI_SYSTEM_PROMPT, RED_FLAG_SYSTEM_PROMPT, HPI_SUMMARY_SYSTEM_PROMPT
from app.services.ai.schemas import NextQuestionResponseSchema, RedFlagAnalysisResponseSchema, ClinicalHistoryResponseSchema
from app.services.ai.safety_rules import safety_scanner
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger("mediassist.ai")

class OpenAIClinicalAIService(BaseClinicalAIService):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        self.timeout = settings.AI_TIMEOUT_SECONDS
        self.max_retries = settings.AI_MAX_RETRIES
        self._client = None

    def _get_client(self) -> OpenAI:
        if not self._client:
            if not self.api_key:
                logger.warning("OPENAI_API_KEY is not set. OpenAI calls will fail if invoked.")
            self._client = OpenAI(
                api_key=self.api_key or "sk-dummy-key",
                timeout=float(self.timeout)
            )
        return self._client

    def determine_next_question(
        self,
        chief_complaint: str,
        answered_questions: List[Any],
        language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        client = self._get_client()

        # Build compact clinical context
        history_context = []
        for item in answered_questions:
            if isinstance(item, dict):
                history_context.append(f"Q ({item.get('question_id')}): A -> {item.get('answer_text')}")
            else:
                history_context.append(f"Answered Question Key: {item}")

        context_str = "\n".join(history_context) if history_context else "No answers recorded yet."

        user_prompt = f"""
Chief Complaint: {chief_complaint}
Target Response Language: {language}

Patient Answers Recorded So Far:
{context_str}

Evaluate what essential clinical information is missing (Onset, Duration, Location, Severity, Character, Associated Symptoms, Red Flags).
If sufficient history is already collected to form an initial clinical summary, set completed=True.
Otherwise, generate the single best adaptive next question.
"""

        for attempt in range(self.max_retries + 1):
            try:
                start_time = time.time()
                logger.info(f"AI_REQUEST_STARTED: model={self.model}, chief_complaint={chief_complaint}")

                completion = client.beta.chat.completions.parse(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": CLINICAL_AI_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format=NextQuestionResponseSchema
                )

                duration = (time.time() - start_time) * 1000
                logger.info(f"AI_REQUEST_COMPLETED: duration={duration:.1f}ms")

                parsed: NextQuestionResponseSchema = completion.choices[0].message.parsed
                if parsed.completed or not parsed.question:
                    return None

                return {
                    "question_id": parsed.question.clinical_domain.lower() if parsed.question.clinical_domain else "followup",
                    "question": parsed.question.text,
                    "type": parsed.question.type,
                    "options": parsed.question.options,
                    "key": parsed.question.clinical_domain.lower() if parsed.question.clinical_domain else "followup"
                }

            except Exception as e:
                logger.error(f"AI_REQUEST_FAILED (attempt {attempt + 1}/{self.max_retries + 1}): {str(e)}")
                if attempt < self.max_retries:
                    time.sleep(1 * (2 ** attempt))
                else:
                    raise AppException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        message="The AI consultation service is temporarily unavailable. Please try again."
                    )

    def detect_red_flags(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        # 1. Deterministic safety check layer first
        rule_trigger = safety_scanner.scan_emergency_triggers(chief_complaint, answers)
        if rule_trigger:
            logger.warning(f"AI_RED_FLAG_DETECTED (Rule-based): category={rule_trigger['category']}")
            return rule_trigger

        # 2. AI model safety check
        client = self._get_client()
        answers_str = "\n".join([f"- {a.get('question_id')}: {a.get('answer_text')}" if isinstance(a, dict) else str(a) for a in answers])
        user_prompt = f"Chief Complaint: {chief_complaint}\nAnswers:\n{answers_str}"

        try:
            completion = client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": RED_FLAG_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format=RedFlagAnalysisResponseSchema
            )

            parsed: RedFlagAnalysisResponseSchema = completion.choices[0].message.parsed
            if parsed.detected and parsed.red_flags:
                rf = parsed.red_flags[0]
                return {
                    "detected": True,
                    "severity": rf.severity,
                    "category": rf.category,
                    "reason": rf.reason,
                    "recommended_action": parsed.recommended_action or "Seek prompt clinical evaluation."
                }
        except Exception as e:
            logger.warning(f"AI Red Flag analysis model check failed, falling back to rule layer: {str(e)}")

        return None

    def generate_hpi_summary(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]],
        language: str = "en"
    ) -> str:
        client = self._get_client()
        answers_str = "\n".join([f"- {a.get('question_id')}: {a.get('answer_text')}" if isinstance(a, dict) else str(a) for a in answers])
        user_prompt = f"Chief Complaint: {chief_complaint}\nLanguage: {language}\nAnswers Recorded:\n{answers_str}"

        try:
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": HPI_SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return completion.choices[0].message.content or f"Patient presents with {chief_complaint}."
        except Exception as e:
            logger.error(f"AI HPI generation failed: {str(e)}")
            parts = [f"Patient presents with chief complaint of {chief_complaint}."]
            for a in answers:
                if isinstance(a, dict):
                    parts.append(f"{a.get('answer_text')}")
                else:
                    parts.append(str(a))
            return " ".join(parts)
