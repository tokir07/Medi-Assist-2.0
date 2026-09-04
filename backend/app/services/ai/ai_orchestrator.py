import json
import time
import logging
import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.core.config import settings
from app.database.models import User, Patient, Doctor
from app.models.ai_conversation import AIConversation, AIMessage, AISummary
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.medical_record import MedicalRecord
from app.models.patient_portal import VoiceSession, VoiceMessage, VoiceSessionStatus
from app.services.ai.openrouter_service import OpenRouterClinicalAIService
from app.services.ai.safety_rules import safety_scanner
from app.services.ai.conversation_controller import conversation_controller, NATURAL_ACKNOWLEDGEMENTS_EN, NATURAL_ACKNOWLEDGEMENTS_HI
from app.services.ai.smart_question_engine import smart_question_engine

from app.core.logging_config import get_logger

logger = get_logger("AI_ORCHESTRATOR")

MEDIASSIST_SYSTEM_PROMPT = """You are MediAssist AI, an intelligent, empathetic, and knowledgeable assistant for the MediAssist Healthcare Web Application.

CRITICAL CONVERSATIONAL RULES:
1. FOCUS ON THE CURRENT MESSAGE: Answer what the user is asking RIGHT NOW. Never get trapped in previous topics or questionnaires if the user switched subjects.
2. NATURAL & CONCISE: Speak warmly and conversationally. Never use robotic repetitive templates (do NOT say 'Mujhe aapki takleef samajh aati hai' repeatedly).
3. CASUAL CONVERSATION: If the user says 'hello', shares personal feelings, vents about roommates, or asks general lifestyle/relationship questions (e.g. 'kya mujhe sex karna chahiye'), engage naturally, warmly, and helpfully. Do NOT turn casual conversation into a medical consultation.
4. INCOMPLETE / UNCLEAR SPEECH: If a voice transcript is ambiguous or incomplete (e.g. 'just', 'having the age'), ask for polite clarification instead of hallucinating medical diagnoses.
5. HEALTH CONCERNS: When the user reports symptoms, synthesize context intelligently (e.g. headache + studying = possible eye strain / tension). Do NOT ask questions that the patient has already answered.
6. MEDICATION QUESTIONS: If the user asks what medicine to take, provide safe, non-prescriptive information on common OTC classes (e.g., Paracetamol) with safety precautions (hydration, rest, checking allergies, consulting a doctor/pharmacist). Never prescribe prescription drugs independently.

APP NAVIGATION KNOWLEDGE:
- Profile: /patient/profile (edit personal details, DOB, blood group, emergency contacts)
- Appointments: /patient/appointments (view and book doctor appointments)
- Prescriptions: /patient/prescriptions (view active medications and doctor notes)
- Records: /patient/records (view and upload lab reports, test results, scans)
- Reminders: /patient/reminders (medication reminders)
- Health Tips: /patient/health-tips (daily wellness tips)
- Voice Assistant: /patient/voice-assistant (hands-free conversational assistant)

LANGUAGE MATCHING:
- Reply in the EXACT language of the user: English for English queries, Hinglish (Hindi in Roman script) for Hinglish queries, Hindi for Hindi script.
"""

CLINICAL_EXTRACTION_PROMPT = """You are MediAssist Clinical Context Analyzer.
Analyze the user's message in the context of their reported symptoms and extract structured clinical facts.
You must return your output strictly in valid JSON format.

Current known context:
{known_context}

User message:
"{user_message}"

Extract and update ONLY facts clearly stated in the message:
- chief_complaint: string or "unknown"
- onset: string or "unknown" (e.g. "yesterday", "4 hours ago", "since morning")
- duration: string or "unknown"
- severity: string or "unknown" (e.g. "7/10", "mild", "severe")
- location: string or "unknown" (e.g. "front of head", "forehead", "left side")
- character: string or "unknown" (e.g. "throbbing", "sharp", "dull")
- triggers_context: string or null (e.g. "long study hours", "screen time", "stress", "dehydration")
- associated_symptoms: list of strings (e.g. ["nausea", "eye strain"])
- is_ready_for_review: boolean (true if chief complaint and 3+ key dimensions are known)
- adaptive_next_response: string (warm, natural conversational acknowledgment + single relevant follow-up in the user's language without repetitive empathy templates)
"""

def _normalize_role(role: str) -> str:
    r = role.lower().strip()
    if r in ["ai", "assistant", "model", "bot"]:
        return "assistant"
    elif r in ["user", "patient"]:
        return "user"
    elif r == "system":
        return "system"
    return "user"

class AIOrchestrator:
    def __init__(self):
        self.openrouter_service = OpenRouterClinicalAIService()
        self.ack_counter = 0

    def _get_initial_context(self) -> Dict[str, Any]:
        return {
            "chief_complaint": "unknown",
            "onset": "unknown",
            "duration": "unknown",
            "severity": "unknown",
            "location": "unknown",
            "character": "unknown",
            "triggers_context": None,
            "associated_symptoms": [],
            "medications_mentioned": [],
            "allergies_mentioned": [],
            "is_red_flag": False,
            "red_flag_reason": None,
            "provenance": {}
        }

    def _get_dynamic_ack(self, is_hinglish: bool) -> str:
        self.ack_counter += 1
        if is_hinglish:
            return NATURAL_ACKNOWLEDGEMENTS_HI[self.ack_counter % len(NATURAL_ACKNOWLEDGEMENTS_HI)]
        return NATURAL_ACKNOWLEDGEMENTS_EN[self.ack_counter % len(NATURAL_ACKNOWLEDGEMENTS_EN)]

    def extract_and_update_consultation(
        self,
        user_message: str,
        current_context: Dict[str, Any],
        recent_dialogue: List[Dict[str, str]],
        is_hinglish: bool
    ) -> Dict[str, Any]:
        """
        Extracts clinical information without acting like a mechanical form.
        """
        # 1. Check OpenRouter LLM extraction
        if self.openrouter_service._is_key_configured():
            try:
                client = self.openrouter_service._get_client()
                prompt = CLINICAL_EXTRACTION_PROMPT.format(
                    known_context=json.dumps(current_context, indent=2),
                    user_message=user_message
                )
                completion = client.chat.completions.create(
                    model=settings.OPENROUTER_MODEL or "openai/gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a clinical NLP extractor. Return ONLY valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                raw = json.loads(completion.choices[0].message.content)

                for key in ["chief_complaint", "onset", "duration", "severity", "location", "character", "triggers_context"]:
                    val = raw.get(key)
                    if val and str(val).lower() != "unknown" and val != current_context.get(key):
                        current_context[key] = val
                        current_context.setdefault("provenance", {})[key] = "AI_EXTRACTED"

                for key in ["associated_symptoms", "medications_mentioned", "allergies_mentioned"]:
                    items = raw.get(key, [])
                    if items:
                        merged = list(set(current_context.get(key, []) + items))
                        current_context[key] = merged
                        current_context.setdefault("provenance", {})[key] = "AI_EXTRACTED"

                current_context["is_ready_for_review"] = raw.get("is_ready_for_review", False)
                current_context["adaptive_next_response"] = raw.get("adaptive_next_response")
                return current_context

            except Exception as e:
                logger.warning(f"OpenRouter extraction failed: {e}. Executing smart rule parser.")

        # 2. Rule-based clinical parser fallback
        q = user_message.lower()
        ack = self._get_dynamic_ack(is_hinglish)

        if current_context.get("chief_complaint") == "unknown":
            if "sar dard" in q or "sir dard" in q or "headache" in q or "migraine" in q:
                current_context["chief_complaint"] = "Headache"
            elif "bukhar" in q or "fever" in q:
                current_context["chief_complaint"] = "Fever"
            elif "pet dard" in q or "pet kharab" in q or "stomach" in q:
                current_context["chief_complaint"] = "Abdominal Pain"
            elif "gale me dard" in q or "throat" in q:
                current_context["chief_complaint"] = "Sore Throat"
            else:
                current_context["chief_complaint"] = user_message[:35]
            current_context.setdefault("provenance", {})["chief_complaint"] = "PATIENT_PROVIDED"

        # Onset / Duration
        if any(w in q for w in ["4 hours", "4 ghante", "4 hrs"]):
            current_context["duration"] = "4 hours"
            current_context.setdefault("provenance", {})["duration"] = "PATIENT_PROVIDED"
        elif any(w in q for w in ["kal se", "yesterday", "since morning", "aaj subah se", "2 days", "2 din"]):
            current_context["onset"] = "yesterday" if "yesterday" in q or "kal" in q else "this morning"
            current_context.setdefault("provenance", {})["onset"] = "PATIENT_PROVIDED"

        # Location
        if any(w in q for w in ["front", "forehead", "front part", "front part mein", "aage"]):
            current_context["location"] = "front of head / forehead"
            current_context.setdefault("provenance", {})["location"] = "PATIENT_PROVIDED"
        elif any(w in q for w in ["temple", "left side", "right side", "back"]):
            current_context["location"] = user_message
            current_context.setdefault("provenance", {})["location"] = "PATIENT_PROVIDED"

        # Context Triggers (e.g. studying, screen time)
        if any(w in q for w in ["padhai", "padhaai", "studying", "study", "screen", "laptop"]):
            current_context["triggers_context"] = "long study hours / screen fatigue"
            current_context.setdefault("provenance", {})["triggers_context"] = "PATIENT_PROVIDED"

        # Severity
        sev_match = re.search(r'\b([1-9]|10)\s*(?:/|\s*out of\s*)?\s*10\b', q)
        if sev_match:
            current_context["severity"] = f"{sev_match.group(1)}/10"
            current_context.setdefault("provenance", {})["severity"] = "PATIENT_PROVIDED"

        complaint = current_context.get("chief_complaint") or "unknown"
        complaint_text = complaint.lower() if complaint != "unknown" else "problem"

        # Formulate intelligent adaptive next response
        if current_context.get("triggers_context") and ("headache" in complaint_text or "sar" in complaint_text or "sir" in complaint_text):
            if is_hinglish:
                current_context["adaptive_next_response"] = f"{ack} Lambi padhai ya screen time se aksar eye strain ya tension headache ho sakta hai. Kya aapne paani theek se piya hai aur thoda break liya?"
            else:
                current_context["adaptive_next_response"] = f"{ack} Long study sessions can often lead to eye strain or tension headaches. Have you been drinking enough water and taking breaks from the screen?"
            current_context["is_ready_for_review"] = True
        elif current_context.get("onset") == "unknown" and current_context.get("duration") == "unknown":
            if is_hinglish:
                current_context["adaptive_next_response"] = f"{ack} Yeh {complaint_text} kab se ho raha hai?"
            else:
                current_context["adaptive_next_response"] = f"{ack} When did you first notice this {complaint_text} starting?"
        elif current_context.get("location") == "unknown" and ("headache" in complaint_text or "pain" in complaint_text or "dard" in complaint_text):
            if is_hinglish:
                current_context["adaptive_next_response"] = f"{ack} Kripya bataiye ki yeh kis hisse me zyada mehsoos ho raha hai?"
            else:
                current_context["adaptive_next_response"] = f"{ack} Where exactly is this most noticeable?"
        elif not current_context.get("associated_symptoms"):
            if is_hinglish:
                current_context["adaptive_next_response"] = f"{ack} Kya iske sath aapko koi aur symptom mehsoos ho raha hai?"
            else:
                current_context["adaptive_next_response"] = f"{ack} Have you noticed any other symptoms alongside this?"
        else:
            current_context["is_ready_for_review"] = True
            if is_hinglish:
                current_context["adaptive_next_response"] = "Maine aapke symptoms ki zaroori jaankari note kar li hai. Kripya details check karein."
            else:
                current_context["adaptive_next_response"] = "I've noted the key details of your symptoms. Please review your summary."

        return current_context

    def handle_medication_query(
        self,
        user_message: str,
        structured_context: Dict[str, Any],
        is_hinglish: bool
    ) -> str:
        """
        Handles explicit user questions about medications responsibly without asking questionnaire questions.
        """
        chief = structured_context.get("chief_complaint", "").lower()
        triggers = structured_context.get("triggers_context")

        if is_hinglish:
            response = (
                "Mild se moderate headache ke liye aamtaur par over-the-counter (OTC) paracetamol ya ibuprofen jaisi dawaaiyan use hoti hain. "
                "Lekin koi bhi dawaai lene se pehle yeh dhyan rakhein:\n\n"
                "• **Precautions:** Agar aapko liver, kidney, stomach ulcers ki takleef hai ya koi allergy hai, toh bina doctor ki salah ke dawa na lein.\n"
                "• **Hydration & Rest:** " + (
                    "Kyunki aap lambi padhai kar rahe the, isliye paani piyein, screen se 20-30 minute ka break lein aur thandi/shaant jagah aaram karein.\n\n"
                    if triggers else "Khoob paani piyein aur thoda aaram karein.\n\n"
                ) +
                "Sahi dosage ke liye apne nazdeeki doctor ya pharmacist se zaroor consult karein."
            )
        else:
            response = (
                "For mild to moderate headaches, common over-the-counter (OTC) pain relievers such as Paracetamol (Acetaminophen) or Ibuprofen are typically used. "
                "However, keep the following safety guidelines in mind:\n\n"
                "• **Safety Considerations:** Avoid medications if you have existing liver or kidney conditions, stomach ulcers, pregnancy, or known allergies.\n"
                "• **Hydration & Screen Rest:** " + (
                    "Since this followed a long study session, taking a 20-minute screen break in a dimly lit room and drinking plenty of water often provides substantial relief.\n\n"
                    if triggers else "Make sure you are well-hydrated and get some quiet rest.\n\n"
                ) +
                "For appropriate dosage and personalized recommendations, always consult a licensed doctor or pharmacist."
            )
        return response

    def handle_openrouter_conversation(
        self,
        query: str,
        recent_messages: List[Dict[str, str]],
        mode: str,
        patient_context_str: str = ""
    ) -> str:
        """
        Communicates with OpenRouter with CURRENT-TURN focus.
        """
        is_hinglish = conversation_controller.is_hinglish(query)

        if not self.openrouter_service._is_key_configured():
            if is_hinglish:
                return "Main sun raha hoon. Aapke dil me jo bhi sawal hai, aap bejhijhak pooch sakte hain."
            return "I am here with you. Please feel free to ask whatever is on your mind."

        try:
            client = self.openrouter_service._get_client()

            # If mode is CASUAL or EMOTIONAL, strip any old medical prompt anchors
            system_content = MEDIASSIST_SYSTEM_PROMPT
            if patient_context_str:
                system_content += f"\nActive User Context: {patient_context_str}"

            # Only include the 4 most recent turns to prevent old questionnaire topic anchoring
            filtered_history = recent_messages[-4:] if len(recent_messages) > 4 else recent_messages
            api_messages = [{"role": "system", "content": system_content}]

            for msg in filtered_history:
                api_messages.append({
                    "role": _normalize_role(msg.get("role", "user")),
                    "content": msg.get("content", "")
                })

            api_messages.append({"role": "user", "content": query})

            completion = client.chat.completions.create(
                model=settings.OPENROUTER_MODEL or "openai/gpt-4o-mini",
                messages=api_messages,
                temperature=0.7,
                max_tokens=300
            )

            raw_reply = completion.choices[0].message.content.strip()
            return raw_reply

        except Exception as e:
            logger.error(f"OpenRouter conversation failed: {e}", exc_info=True)
            if is_hinglish:
                return "Main aapki baat sun raha hoon. Bataiye main aapki kya madad kar sakta hoon?"
            return "I am here to help you. How can I assist you right now?"

    def generate_chat_response(
        self,
        conversation_id: str,
        user_message: str,
        patient_id: str,
        db: Session
    ) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"[STEP 1/5] Received chat message for conversation '{conversation_id}' (patient_id={patient_id}): '{user_message[:40]}...'")

        # 1. Fetch or create conversation
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.patient_id == patient_id
        ).first()

        if not conv:
            conv = AIConversation(
                id=conversation_id,
                patient_id=patient_id,
                title="AI Assistant",
                consultation_state="IN_PROGRESS",
                structured_context=json.dumps(self._get_initial_context())
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)
            logger.info(f"[STEP 1/5 SUCCESS] Created new AIConversation id={conv.id}")

        # 2. Save User Message
        user_msg = AIMessage(
            conversation_id=conv.id,
            sender_role="user",
            content=user_message,
            message_type="text"
        )
        db.add(user_msg)
        db.commit()

        # Save User Message into VoiceSession / VoiceMessage ONLY if an active voice session exists
        v_session = db.query(VoiceSession).filter(
            VoiceSession.ai_conversation_id == conv.id,
            VoiceSession.patient_id == patient_id
        ).order_by(desc(VoiceSession.started_at)).first()

        seq_user = 0
        if v_session:
            last_vmsg = db.query(VoiceMessage).filter(
                VoiceMessage.voice_session_id == v_session.id
            ).order_by(desc(VoiceMessage.sequence_number)).first()

            seq_user = (last_vmsg.sequence_number + 1) if last_vmsg else 1

            user_vmsg = VoiceMessage(
                voice_session_id=v_session.id,
                role="user",
                content=user_message,
                sequence_number=seq_user,
                message_type="voice_transcription",
                timestamp=datetime.now(timezone.utc)
            )
            db.add(user_vmsg)
            db.commit()

        # 3. Load Structured Context
        try:
            structured_ctx = json.loads(conv.structured_context) if conv.structured_context else self._get_initial_context()
        except Exception:
            structured_ctx = self._get_initial_context()

        # 4. Fetch recent history
        past_msgs = db.query(AIMessage).filter(
            AIMessage.conversation_id == conv.id
        ).order_by(AIMessage.created_at.asc()).limit(6).all()
        recent_dialogue = [{"role": m.sender_role, "content": m.content} for m in past_msgs]

        # 5. Patient Context
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        user = db.query(User).filter(User.id == patient.user_id).first() if patient else None
        patient_context_str = f"Patient Name: {user.name if user else 'Patient'}, Email: {user.email if user else ''}"

        # 6. LAYER 2: Conversation Controller Current-Turn Analysis
        turn_analysis = conversation_controller.analyze_turn(
            current_message=user_message,
            structured_context=structured_ctx,
            recent_history=recent_dialogue
        )
        intent = turn_analysis["intent"]
        mode = turn_analysis["mode"]
        is_hinglish = turn_analysis["is_hinglish"]

        logger.info(f"CONVERSATION_CONTROLLER: intent={intent}, mode={mode}, query='{user_message[:40]}'")

        message_type = "text"
        structured_payload = None
        action_data = None
        ai_response_text = ""

        # ROUTE 1: Ambiguous / Incomplete Speech Tokens
        if intent == "AMBIGUOUS_INCOMPLETE":
            if is_hinglish:
                ai_response_text = "Haan, main sun raha hoon. Aap bataiye kya chal raha hai?"
            else:
                ai_response_text = "I'm listening. Go ahead, take your time."

        # ROUTE 2: Unclear / Ambiguous Medical Speech (STT Error Prevention)
        elif intent == "CLARIFICATION_NEEDED":
            if is_hinglish:
                ai_response_text = "Main theek se samajh nahi paaya ki aap kis condition ya takleef ki baat kar rahe hain. Kya aap dobara bata sakte hain ki unhe kya problem hai?"
            else:
                ai_response_text = "I didn't quite catch the specific health condition you mentioned. Could you clarify what condition or symptoms you are referring to?"

        # ROUTE 3: Emergency Red Flag
        elif intent == "EMERGENCY_RED_FLAG":
            if is_hinglish:
                ai_response_text = (
                    "⚠️ **Emergency Alert / Turant Madad Ki Zaroorat**\n\n"
                    "Aapne jo symptoms bataye hain, usme foran emergency medical evaluation ki zaroorat hai.\n\n"
                    "• Turant emergency services (112) ko call karein ya nazdeeki hospital jaayein.\n"
                    "• Agar chakkar ya chhati me dard hai toh khud drive na karein."
                )
            else:
                ai_response_text = (
                    "⚠️ **Emergency Medical Alert — Urgent Attention Needed**\n\n"
                    "The symptoms you described require prompt medical evaluation.\n\n"
                    "• Seek immediate medical attention at your nearest emergency department or call emergency services (112).\n"
                    "• Do not drive yourself if you are feeling weak, dizzy, or experiencing chest tightness."
                )
            message_type = "red_flag_alert"
            structured_payload = json.dumps({"red_flag": True, "action": "Emergency medical evaluation required"})

        # ROUTE 4: Violence / Self-Harm De-escalation
        elif intent == "VIOLENCE_DEESCALATION":
            if is_hinglish:
                ai_response_text = (
                    "Main samajh sakta hoon ki aap bohot zyada gussa ya frustrated mehsoos kar rahe hain. "
                    "Lekin kisi ko chot pahunchana kisi problem ka solution nahi hai. "
                    "Thoda gehra saans lein, kuch der ke liye us jagah se door chale jaayein. "
                    "Agar aap baat karna chahte hain, toh main yahan sunne ke liye tayyar hoon."
                )
            else:
                ai_response_text = (
                    "I can hear that you're feeling intensely frustrated and angry right now. "
                    "However, hurting anyone won't solve the underlying issue. "
                    "Please take a few deep breaths and step away from the situation for a few minutes to cool down. "
                    "I'm here to listen if you'd like to talk through what happened."
                )

        # ROUTE 5: Medication Question (Direct Handling without Questionnaire Interruption)
        elif intent == "MEDICATION_QUESTION":
            ai_response_text = self.handle_medication_query(
                user_message=user_message,
                structured_context=structured_ctx,
                is_hinglish=is_hinglish
            )
            action_data = {"label": "View Prescriptions", "route": "/patient/prescriptions"}

        # ROUTE 6: App Navigation - Profile
        elif intent == "PROFILE_HELP":
            if is_hinglish:
                ai_response_text = (
                    "Aap apna profile sidebar me **Profile** section (/patient/profile) se update kar sakte hain. "
                    "Wahan aap apna naam, phone number, date of birth, blood group aur emergency contact edit karke save kar sakte hain."
                )
            else:
                ai_response_text = (
                    "You can update your personal information and preferences by visiting the **Profile** section in the sidebar. "
                    "From there, you can edit your name, phone number, date of birth, blood group, and emergency contacts, then click save."
                )
            action_data = {"label": "Open Profile", "route": "/patient/profile"}

        # ROUTE 7: App Navigation - Appointments
        elif intent == "APPOINTMENT_HELP":
            if is_hinglish:
                ai_response_text = (
                    "Aap apne scheduled aur past appointments dekhne ke liye sidebar me **Appointments** section (/patient/appointments) me ja sakte hain. "
                    "Wahan aap naye doctor ke sath appointment bhi book kar sakte hain."
                )
            else:
                ai_response_text = (
                    "You can view your scheduled doctor visits, past consultations, and book new appointments in the **Appointments** section (/patient/appointments) in the sidebar."
                )
            action_data = {"label": "Open Appointments", "route": "/patient/appointments"}

        # ROUTE 8: App Navigation - Prescriptions
        elif intent == "PRESCRIPTION_HELP":
            if is_hinglish:
                ai_response_text = (
                    "Aapki saari active aur purani prescriptions sidebar me **Prescriptions** section (/patient/prescriptions) me available hain."
                )
            else:
                ai_response_text = (
                    "You can access all your active and past prescribed medications and dosages under the **Prescriptions** section (/patient/prescriptions) in the sidebar."
                )
            action_data = {"label": "Open Prescriptions", "route": "/patient/prescriptions"}

        # ROUTE 9: App Navigation - Medical Records
        elif intent == "MEDICAL_RECORD_HELP":
            if is_hinglish:
                ai_response_text = (
                    "Aap apne lab reports, test results aur scans dekhne ya naye documents upload karne ke liye **My Records** section (/patient/records) me ja sakte hain."
                )
            else:
                ai_response_text = (
                    "You can view, download, and securely upload lab test results, imaging scans, and doctor summaries in the **My Records** section (/patient/records) from the sidebar."
                )
            action_data = {"label": "Open My Records", "route": "/patient/records"}

        # ROUTE 10: DB Query - Next Appointment
        elif intent == "APPOINTMENT_QUERY":
            next_apt = db.query(Appointment).filter(
                Appointment.patient_id == patient_id,
                Appointment.is_deleted == False,
                Appointment.status != "Cancelled"
            ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).first()

            if next_apt:
                formatted_date = str(next_apt.appointment_date)
                try:
                    d_obj = datetime.strptime(str(next_apt.appointment_date), "%Y-%m-%d")
                    formatted_date = d_obj.strftime("%B %d, %Y")
                except Exception:
                    pass

                if is_hinglish:
                    ai_response_text = (
                        f"Aapka agla scheduled appointment **{next_apt.doctor_name}** ({next_apt.doctor_specialty}) ke sath "
                        f"**{formatted_date}** ko **{next_apt.appointment_time}** ({next_apt.mode}) {next_apt.hospital} me hai."
                    )
                else:
                    ai_response_text = (
                        f"Your next scheduled appointment is with **{next_apt.doctor_name}** ({next_apt.doctor_specialty}) "
                        f"on **{formatted_date}** at **{next_apt.appointment_time}** ({next_apt.mode}) at {next_apt.hospital}."
                    )
            else:
                if is_hinglish:
                    ai_response_text = "Filhaal aapka koi upcoming appointment scheduled nahi hai. Aap Appointments section se naya consultation book kar sakte hain."
                else:
                    ai_response_text = "You currently have no upcoming appointments scheduled. You can book a consultation anytime from the Appointments section."
            action_data = {"label": "Open Appointments", "route": "/patient/appointments"}

        # ROUTE 11: DB Query - Prescriptions
        elif intent == "PRESCRIPTION_QUERY":
            rxs = db.query(Prescription).filter(
                Prescription.patient_id == patient_id,
                Prescription.is_deleted == False,
                Prescription.status.ilike('%Active%')
            ).order_by(desc(Prescription.created_at)).limit(6).all()

            if rxs:
                all_meds = []
                for r in rxs:
                    if r.medications_data:
                        try:
                            m_list = json.loads(r.medications_data) if isinstance(r.medications_data, str) else r.medications_data
                            for m in m_list:
                                if isinstance(m, dict) and m.get("medication_name"):
                                    all_meds.append(f"• **{m.get('medication_name')}** ({m.get('dosage') or '1 tablet'} - {m.get('frequency') or 'As directed'}) prescribed by {r.doctor_name}")
                        except Exception:
                            all_meds.append(f"• **{r.medication_name}** ({r.dosage} - {r.frequency}) prescribed by {r.doctor_name}")
                    else:
                        all_meds.append(f"• **{r.medication_name}** ({r.dosage} - {r.frequency}) prescribed by {r.doctor_name}")

                rx_list = "\n".join(all_meds[:8])
                if is_hinglish:
                    ai_response_text = f"Yeh rahi aapki active prescribed medications:\n\n{rx_list}\n\nKripya doctor ke bataye anusaar hi dosage lein."
                else:
                    ai_response_text = f"Here are your active prescribed medications:\n\n{rx_list}\n\nAlways follow your doctor's dosage instructions."
            else:
                if is_hinglish:
                    ai_response_text = "Abhi aapke record par koi active prescription nahi hai."
                else:
                    ai_response_text = "You do not have any active prescriptions on record right now."
            action_data = {"label": "Open Prescriptions", "route": "/patient/prescriptions"}

        # ROUTE 12: DB Query - Patient Personal Details
        elif intent == "PATIENT_DATA_QUERY":
            if user:
                ai_response_text = f"Your registered profile name is **{user.name}** and your email is **{user.email}**."
            else:
                ai_response_text = "I couldn't retrieve your profile data right now."
            action_data = {"label": "Open Profile", "route": "/patient/profile"}

        # ROUTE 13: Personal Health Concern (Adaptive Pre-Consultation)
        elif intent == "PERSONAL_HEALTH_CONCERN":
            updated_context = self.extract_and_update_consultation(
                user_message=user_message,
                current_context=structured_ctx,
                recent_dialogue=recent_dialogue,
                is_hinglish=is_hinglish
            )
            conv.structured_context = json.dumps(updated_context)

            if updated_context.get("is_ready_for_review"):
                conv.consultation_state = "PATIENT_REVIEW"
                ai_response_text = updated_context.get("adaptive_next_response") or (
                    "Maine aapke symptoms ki zaroori jaankari note kar li hai. Kripya niche summary card me details check karein."
                    if is_hinglish else
                    "I have gathered the key clinical details of your symptoms. Please review your summary card below to confirm."
                )
                message_type = "review_card"
                structured_payload = json.dumps({
                    "chief_complaint": updated_context.get("chief_complaint"),
                    "onset": updated_context.get("onset"),
                    "duration": updated_context.get("duration"),
                    "severity": updated_context.get("severity"),
                    "location": updated_context.get("location"),
                    "triggers_context": updated_context.get("triggers_context"),
                    "associated_symptoms": updated_context.get("associated_symptoms", []),
                    "provenance": updated_context.get("provenance", {})
                })
            else:
                ai_response_text = updated_context.get("adaptive_next_response") or (
                    "Kya aap koi aur symptom bhi mehsoos kar rahe hain?" if is_hinglish else "Are you experiencing any other symptoms?"
                )

            if conv.title in ["Health Consultation", "Voice Consultation", "New Health Consultation"] and updated_context.get("chief_complaint") != "unknown":
                conv.title = f"{updated_context.get('chief_complaint')} Consultation"

        # ROUTE 14: Casual / Emotional / General Conversation via OpenRouter
        else:
            ai_response_text = self.handle_openrouter_conversation(
                query=user_message,
                recent_messages=recent_dialogue,
                mode=mode,
                patient_context_str=patient_context_str
            )

        duration_ms = (time.time() - start_time) * 1000

        # Smart Question Engine & Question Repetition Guard Check
        session_state = structured_ctx.get("smart_engine_state") or smart_question_engine.initialize_session_state()
        session_state = smart_question_engine.extract_facts_from_utterance(user_message, session_state)
        smart_mode, smart_topic = smart_question_engine.detect_conversation_mode(user_message, session_state)
        session_state["conversation_mode"] = smart_mode
        session_state["current_topic"] = smart_topic

        # Verify proposed AI question repetition
        if "?" in ai_response_text and smart_mode == "HEALTH_CONSULTATION":
            allowed, reason = smart_question_engine.is_question_allowed(ai_response_text, session_state)
            if not allowed:
                logger.info(f"QUESTION REPETITION GUARD BLOCKED candidate question: '{ai_response_text}' ({reason})")
                ack = self._get_dynamic_ack(is_hinglish)
                if smart_question_engine.should_stop_questioning(session_state):
                    if is_hinglish:
                        ai_response_text = f"{ack} Maine aapke symptoms note kar liye hain. Aaram karein, paani piyein aur zarurat hone par doctor se consult karein."
                    else:
                        ai_response_text = f"{ack} Thank you for sharing your symptoms. Please take rest, stay hydrated, and consult a doctor if needed."
                else:
                    ans_info = session_state.get("answered_information", {})
                    if "severity" not in ans_info:
                        ai_response_text = f"{ack} Yeh dikkat kitni zyada hai—mild, moderate ya severe?" if is_hinglish else f"{ack} How severe is this concern right now—mild, moderate, or severe?"
                    elif "associated_symptoms" not in ans_info and not ans_info.get("associated_symptoms_denied"):
                        ai_response_text = f"{ack} Kya iske sath koi aur symptom mehsoos ho raha hai?" if is_hinglish else f"{ack} Are you experiencing any other symptoms alongside this?"
                    else:
                        ai_response_text = f"{ack} Saari details note kar li hain. Rest karein aur paani piyein." if is_hinglish else f"{ack} All details have been recorded. Please rest and drink plenty of water."

        if "?" in ai_response_text and smart_mode == "HEALTH_CONSULTATION":
            session_state = smart_question_engine.record_asked_question(ai_response_text, session_state)

        structured_ctx["smart_engine_state"] = session_state
        conv.structured_context = json.dumps(structured_ctx)

        # Save AI Message into AIConversation
        ai_msg = AIMessage(
            conversation_id=conv.id,
            sender_role="ai",
            content=ai_response_text,
            message_type=message_type,
            structured_payload=structured_payload,
            action_data=json.dumps(action_data) if action_data else None,
            model=settings.OPENROUTER_MODEL or "openai/gpt-4o-mini",
            latency_ms=duration_ms
        )
        db.add(ai_msg)
        conv.summary_preview = user_message[:60]
        conv.updated_at = datetime.now(timezone.utc)

        # Save AI Message into VoiceMessage ONLY if an active VoiceSession exists
        if v_session:
            seq_ai = seq_user + 1
            ai_vmsg = VoiceMessage(
                voice_session_id=v_session.id,
                role="assistant",
                content=ai_response_text,
                sequence_number=seq_ai,
                message_type="assistant_response",
                timestamp=datetime.now(timezone.utc),
                metadata_json=json.dumps({"intent": intent, "model": settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"})
            )
            db.add(ai_vmsg)

            # Update VoiceSession metadata
            v_session.conversation_mode = smart_mode
            v_session.status = VoiceSessionStatus.LISTENING
            ans_facts = session_state.get("answered_information", {})

            kp = []
            if ans_facts.get("chief_complaint"):
                kp.append(f"{ans_facts.get('chief_complaint')} reported")
            if ans_facts.get("onset"):
                kp.append(f"Started: {ans_facts.get('onset')}")
            if ans_facts.get("location"):
                kp.append(f"Location: {ans_facts.get('location')}")
            if ans_facts.get("severity"):
                kp.append(f"Severity: {ans_facts.get('severity')}")
            if ans_facts.get("triggers_context"):
                kp.append(f"Context: {ans_facts.get('triggers_context')}")

            if kp:
                v_session.key_points = json.dumps(kp)
                v_session.extracted_medical_context = json.dumps(ans_facts)
                v_session.summary = f"Patient discussed {ans_facts.get('chief_complaint', 'health concern')} (Onset: {ans_facts.get('onset', 'N/A')}, Location: {ans_facts.get('location', 'N/A')})."

            v_session.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(ai_msg)

        return {
            "id": ai_msg.id,
            "conversation_id": conv.id,
            "sender": "ai",
            "text": ai_response_text,
            "message_type": message_type,
            "structured_payload": json.loads(structured_payload) if structured_payload else None,
            "action": action_data,
            "consultation_state": conv.consultation_state,
            "timestamp": ai_msg.created_at.strftime("%I:%M %p"),
            "model": ai_msg.model,
            "latency_ms": duration_ms
        }

    def confirm_and_generate_clinical_history(
        self,
        conversation_id: str,
        patient_id: str,
        db: Session
    ) -> Dict[str, Any]:
        conv = db.query(AIConversation).filter(
            AIConversation.id == conversation_id,
            AIConversation.patient_id == patient_id
        ).first()

        if not conv:
            raise ValueError("Conversation not found")

        context = json.loads(conv.structured_context) if conv.structured_context else self._get_initial_context()
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        user = db.query(User).filter(User.id == patient.user_id).first() if patient else None

        pt_name = user.name if user else "Patient"
        now_str = datetime.now(timezone.utc).strftime("%d %B %Y, %I:%M %p UTC")

        chief = context.get("chief_complaint", "General Consultation")
        onset = context.get("onset", context.get("duration", "Recent"))
        severity = context.get("severity", "Unspecified")
        location = context.get("location", "Unspecified")
        triggers = context.get("triggers_context", "None reported")
        assoc = ", ".join(context.get("associated_symptoms", [])) or "None reported"

        summary_md = f"""# MediAssist Clinical Pre-Consultation Summary

**Patient:** {pt_name}  
**Date:** {now_str}  
**Status:** Verified Clinical Pre-Consultation  

---

### 1. Chief Complaint
**{chief}**

### 2. History of Present Illness (HPI)
• **Onset & Duration:** {onset}  
• **Severity:** {severity}  
• **Location:** {location}  
• **Contributing Triggers:** {triggers}  
• **Associated Symptoms:** {assoc}  

### 3. Patient Review Status
The patient reviewed and confirmed these symptoms prior to doctor consultation.

### 4. Attending Doctor Action Plan
Doctor evaluation and physical examination recommended.
"""

        today_str = datetime.now(timezone.utc).strftime("%d %b %Y")
        summary_record = AISummary(
            patient_id=patient_id,
            title=f"Clinical Pre-Consultation: {conv.title or 'Voice Session'}",
            date_from=today_str,
            date_to=today_str,
            conversations_count=1,
            main_concerns=json.dumps([chief] if chief else ["Clinical Consultation"]),
            symptoms_mentioned=json.dumps(context.get("associated_symptoms", [])),
            medications_mentioned=json.dumps(context.get("medications_discussed", [])),
            ai_guidance="Pre-consultation clinical history recorded.",
            follow_up_recommendations="In-person doctor evaluation and physical examination recommended.",
            doctor_readable_report=summary_md,
            model_used=settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
        )
        db.add(summary_record)
        conv.summary_preview = f"Chief: {chief} | Duration: {onset} | Severity: {severity}"
        conv.consultation_state = "COMPLETED"
        conv.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "conversation_id": conv.id,
            "status": "COMPLETED",
            "clinical_summary": summary_md,
            "structured_context": context
        }

ai_orchestrator = AIOrchestrator()
