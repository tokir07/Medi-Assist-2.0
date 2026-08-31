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
from app.services.ai.mock_service import MockClinicalAIService
from app.utils.exceptions import AppException
from fastapi import status

logger = logging.getLogger("mediassist.ai")

class OpenRouterClinicalAIService(BaseClinicalAIService):
    """
    Production OpenRouter AI Gateway integration using official OpenAI Python SDK.
    Communicates via OPENROUTER_BASE_URL (https://openrouter.ai/api/v1).
    """

    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
        self.timeout = settings.AI_TIMEOUT_SECONDS
        self.max_retries = settings.AI_MAX_RETRIES
        self._fallback_service = MockClinicalAIService()
        self._client = None

    def _is_key_configured(self) -> bool:
        if not self.api_key or len(self.api_key) < 15:
            return False
        key_lower = self.api_key.lower()
        if "your-key" in key_lower or "dummy" in key_lower or "your-openrouter-key" in key_lower:
            return False
        return True

    def _get_client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                default_headers={
                    "HTTP-Referer": settings.OPENROUTER_HTTP_REFERER,
                    "X-Title": settings.OPENROUTER_APP_NAME
                },
                timeout=float(self.timeout)
            )
        return self._client

    def determine_next_question(
        self,
        chief_complaint: str,
        answered_questions: List[Any],
        language: str = "en"
    ) -> Optional[Dict[str, Any]]:
        if not self._is_key_configured():
            logger.info("OPENROUTER_API_KEY is not configured. Delegating to MockClinicalAIService fallback.")
            return self._fallback_service.determine_next_question(chief_complaint, answered_questions, language)

        client = self._get_client()

        # Construct compact clinical context
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
                logger.info(f"AI_REQUEST_STARTED: provider=OpenRouter, model={self.model}, chief_complaint={chief_complaint}")

                completion = client.beta.chat.completions.parse(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": CLINICAL_AI_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format=NextQuestionResponseSchema
                )

                duration = (time.time() - start_time) * 1000
                logger.info(f"AI_REQUEST_COMPLETED: provider=OpenRouter, duration={duration:.1f}ms")

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
                    logger.warning("OpenRouter API request failed after retries, executing fallback service.")
                    return self._fallback_service.determine_next_question(chief_complaint, answered_questions, language)

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

        if not self._is_key_configured():
            return None

        # 2. AI model safety check via OpenRouter
        try:
            client = self._get_client()
            answers_str = "\n".join([f"- {a.get('question_id')}: {a.get('answer_text')}" if isinstance(a, dict) else str(a) for a in answers])
            user_prompt = f"Chief Complaint: {chief_complaint}\nAnswers:\n{answers_str}"

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
            logger.warning(f"OpenRouter Red Flag model check failed, using rule layer: {str(e)}")

        return None

    def generate_hpi_summary(
        self,
        chief_complaint: str,
        answers: List[Dict[str, Any]],
        language: str = "en"
    ) -> str:
        if not self._is_key_configured():
            return self._fallback_service.generate_hpi_summary(chief_complaint, answers, language)

        try:
            client = self._get_client()
            answers_str = "\n".join([f"- {a.get('question_id')}: {a.get('answer_text')}" if isinstance(a, dict) else str(a) for a in answers])
            user_prompt = f"Chief Complaint: {chief_complaint}\nLanguage: {language}\nAnswers Recorded:\n{answers_str}"

            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": HPI_SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return completion.choices[0].message.content or f"Patient presents with {chief_complaint}."
        except Exception as e:
            logger.error(f"OpenRouter HPI generation failed, using fallback: {str(e)}")
            return self._fallback_service.generate_hpi_summary(chief_complaint, answers, language)

    def stream_chat_completion(self, messages: List[Dict[str, str]]):
        """
        Stream progressive AI tokens using Server-Sent Events (SSE).
        TTFT < 300ms.
        """
        if not self._is_key_configured():
            # Fast Fallback Generator
            text = "Hi! I am MediAssist AI 🩺. I am here to help you navigate your appointments, understand medical records, track prescriptions, and provide health advice."
            for word in text.split(" "):
                time.sleep(0.03)
                yield f"data: {json.dumps({'content': word + ' '})}\n\n"
            yield "data: [DONE]\n\n"
            return

        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True
            )
            for chunk in response:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield f"data: {json.dumps({'content': delta.content})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"OpenRouter SSE Streaming Error: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
