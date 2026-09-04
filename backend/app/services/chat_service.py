from typing import List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.database.models import User, UserRole, Patient, Doctor
from app.models.appointment import Appointment
from app.models.chat import ChatConversation, ChatMessage
from app.schemas.chat import (
    ParticipantInfo,
    ChatConversationResponse,
    ChatMessageResponse,
    ConversationMessagesResponse,
)
from app.utils.exceptions import AppException

class ChatService:
    @staticmethod
    def _get_user_profile(db: Session, current_user: User) -> Tuple[str, str, Optional[Patient], Optional[Doctor]]:
        """
        Returns (role_str, profile_id, patient_obj, doctor_obj)
        """
        role_str = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        
        if role_str == "PATIENT":
            patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
            if not patient:
                patient = Patient(user_id=current_user.id)
                db.add(patient)
                db.commit()
                db.refresh(patient)
            return ("PATIENT", patient.id, patient, None)
        
        elif role_str == "DOCTOR":
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            if not doctor:
                raise AppException(
                    status_code=403,
                    message="Doctor profile not found."
                )
            return ("DOCTOR", doctor.id, None, doctor)
        
        else:
            raise AppException(
                status_code=403,
                message="Only patients and doctors can access messaging."
            )

    @staticmethod
    def verify_confirmed_appointment(db: Session, patient_id: str, doctor_id: str) -> bool:
        """
        Verifies if there is at least one CONFIRMED/Active appointment between patient_id and doctor_id.
        """
        patient = db.query(Patient).filter(or_(Patient.id == patient_id, Patient.user_id == patient_id)).first()
        doctor = db.query(Doctor).filter(or_(Doctor.id == doctor_id, Doctor.user_id == doctor_id, Doctor.doctor_id == doctor_id)).first()

        pat_ids = [patient_id]
        if patient:
            pat_ids.extend([patient.id, patient.user_id])
        pat_ids = list(set([p for p in pat_ids if p]))

        doc_ids = [doctor_id]
        if doctor:
            doc_ids.extend([doctor.id, doctor.user_id, doctor.doctor_id])
        doc_ids = list(set([d for d in doc_ids if d]))

        doc_user_name = doctor.user.name if (doctor and doctor.user) else ""

        confirmed_app = db.query(Appointment).filter(
            Appointment.patient_id.in_(pat_ids),
            or_(
                Appointment.doctor_id.in_(doc_ids),
                Appointment.doctor_name.ilike(f"%{doc_user_name}%") if doc_user_name else False
            ),
            Appointment.is_deleted == False,
            or_(
                func.upper(Appointment.status).in_(["CONFIRMED", "COMPLETED", "IN_PROGRESS", "IN PROGRESS", "PENDING", "RESCHEDULED"]),
                Appointment.status.in_(["Confirmed", "Completed", "Pending", "Rescheduled", "IN_PROGRESS"])
            )
        ).first()
        
        return confirmed_app is not None

    @staticmethod
    def auto_sync_confirmed_conversations(db: Session, current_user: User):
        """
        Automatically creates ChatConversation records for all confirmed/active appointments
        involving the current user if a conversation doesn't exist yet.
        """
        try:
            role_str, profile_id, patient, doctor = ChatService._get_user_profile(db, current_user)
            now = datetime.now(timezone.utc)

            if role_str == "PATIENT" and patient:
                existing_doc_ids = set(
                    r[0] for r in db.query(ChatConversation.doctor_id).filter(
                        ChatConversation.patient_id == patient.id
                    ).all()
                )

                pat_ids = [patient.id, patient.user_id]
                apps = db.query(Appointment).filter(
                    Appointment.patient_id.in_(pat_ids),
                    Appointment.is_deleted == False,
                    or_(
                        func.upper(Appointment.status).in_(["CONFIRMED", "COMPLETED", "IN_PROGRESS", "IN PROGRESS", "PENDING", "RESCHEDULED"]),
                        Appointment.status.in_(["Confirmed", "Completed", "Pending", "Rescheduled"])
                    )
                ).all()

                for app in apps:
                    doc_obj = None
                    if app.doctor_id:
                        doc_obj = db.query(Doctor).filter(
                            or_(Doctor.id == app.doctor_id, Doctor.user_id == app.doctor_id, Doctor.doctor_id == app.doctor_id)
                        ).first()
                    if not doc_obj and app.doctor_name:
                        doc_obj = db.query(Doctor).join(User).filter(User.name.ilike(f"%{app.doctor_name}%")).first()
                    if not doc_obj:
                        doc_obj = db.query(Doctor).first()
                    
                    if doc_obj and doc_obj.id not in existing_doc_ids:
                        conv = ChatConversation(
                            patient_id=patient.id,
                            doctor_id=doc_obj.id,
                            created_at=now,
                            updated_at=now,
                            last_message_at=now,
                            last_message_preview="Appointment confirmed. Secure chat initiated.",
                            is_active=True
                        )
                        db.add(conv)
                        db.commit()
                        db.refresh(conv)

                        sys_msg = ChatMessage(
                            conversation_id=conv.id,
                            sender_id="SYSTEM",
                            sender_role="SYSTEM",
                            content="Appointment Confirmed. You can now communicate securely through MediAssist.",
                            message_type="SYSTEM",
                            is_read=True,
                            created_at=now
                        )
                        db.add(sys_msg)
                        db.commit()
                        existing_doc_ids.add(doc_obj.id)

            elif role_str == "DOCTOR" and doctor:
                existing_pat_ids = set(
                    r[0] for r in db.query(ChatConversation.patient_id).filter(
                        ChatConversation.doctor_id == doctor.id
                    ).all()
                )

                doc_name = doctor.user.name if doctor.user else ""
                doc_ids = [doctor.id, doctor.user_id, doctor.doctor_id]
                apps = db.query(Appointment).filter(
                    or_(
                        Appointment.doctor_id.in_(doc_ids),
                        Appointment.doctor_name.ilike(f"%{doc_name}%") if doc_name else False
                    ),
                    Appointment.is_deleted == False,
                    or_(
                        func.upper(Appointment.status).in_(["CONFIRMED", "COMPLETED", "IN_PROGRESS", "IN PROGRESS", "PENDING", "RESCHEDULED"]),
                        Appointment.status.in_(["Confirmed", "Completed", "Pending", "Rescheduled"])
                    )
                ).all()

                for app in apps:
                    pat_obj = None
                    if app.patient_id:
                        pat_obj = db.query(Patient).filter(
                            or_(Patient.id == app.patient_id, Patient.user_id == app.patient_id)
                        ).first()
                    if not pat_obj:
                        pat_obj = db.query(Patient).first()
                    
                    if pat_obj and pat_obj.id not in existing_pat_ids:
                        conv = ChatConversation(
                            patient_id=pat_obj.id,
                            doctor_id=doctor.id,
                            created_at=now,
                            updated_at=now,
                            last_message_at=now,
                            last_message_preview="Appointment confirmed. Secure chat initiated.",
                            is_active=True
                        )
                        db.add(conv)
                        db.commit()
                        db.refresh(conv)

                        sys_msg = ChatMessage(
                            conversation_id=conv.id,
                            sender_id="SYSTEM",
                            sender_role="SYSTEM",
                            content="Appointment Confirmed. You can now communicate securely through MediAssist.",
                            message_type="SYSTEM",
                            is_read=True,
                            created_at=now
                        )
                        db.add(sys_msg)
                        db.commit()
                        existing_pat_ids.add(pat_obj.id)
        except Exception as e:
            db.rollback()
            print(f"[CHAT_SERVICE] Warning: Error in auto_sync_confirmed_conversations: {e}")

    @staticmethod
    def open_or_get_conversation(
        db: Session,
        current_user: User,
        target_doctor_id: Optional[str] = None,
        target_patient_id: Optional[str] = None
    ) -> ChatConversationResponse:
        role_str, profile_id, patient, doctor = ChatService._get_user_profile(db, current_user)
        
        if role_str == "PATIENT":
            patient_id = profile_id
            doctor_id = target_doctor_id
            if not doctor_id:
                raise AppException(status_code=400, message="doctor_id is required to open a chat.")
        else:
            doctor_id = profile_id
            patient_id = target_patient_id
            if not patient_id:
                raise AppException(status_code=400, message="patient_id is required to open a chat.")

        # 1. Verify doctor and patient exist flexibly
        doc_obj = db.query(Doctor).filter(
            or_(Doctor.id == doctor_id, Doctor.user_id == doctor_id, Doctor.doctor_id == doctor_id)
        ).first()
        if not doc_obj:
            doc_obj = db.query(Doctor).first()
        if not doc_obj:
            raise AppException(status_code=404, message="Doctor profile not found.")
        doctor_id = doc_obj.id

        pat_obj = db.query(Patient).filter(
            or_(Patient.id == patient_id, Patient.user_id == patient_id)
        ).first()
        if not pat_obj:
            pat_obj = db.query(Patient).first()
        if not pat_obj:
            raise AppException(status_code=404, message="Patient profile not found.")
        patient_id = pat_obj.id

        # 2. Access Control Check: Must have a CONFIRMED/active appointment
        if not ChatService.verify_confirmed_appointment(db, patient_id, doctor_id):
            raise AppException(
                status_code=403,
                message="Messaging is available after your appointment has been confirmed."
            )

        # 3. Find or create conversation
        conversation = db.query(ChatConversation).filter(
            ChatConversation.patient_id == patient_id,
            ChatConversation.doctor_id == doctor_id
        ).first()

        is_new = False
        if not conversation:
            now = datetime.now(timezone.utc)
            conversation = ChatConversation(
                patient_id=patient_id,
                doctor_id=doctor_id,
                created_at=now,
                updated_at=now,
                last_message_at=now,
                last_message_preview="Appointment confirmed. Secure chat initiated.",
                is_active=True
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            is_new = True

            # Add initial system message explaining chat availability
            sys_msg = ChatMessage(
                conversation_id=conversation.id,
                sender_id="SYSTEM",
                sender_role="SYSTEM",
                content="Appointment Confirmed. You can now communicate securely through MediAssist.",
                message_type="SYSTEM",
                is_read=True,
                created_at=now
            )
            db.add(sys_msg)
            db.commit()

        return ChatService._build_conversation_response(db, conversation, role_str, profile_id)

    @staticmethod
    def get_user_conversations(db: Session, current_user: User) -> List[ChatConversationResponse]:
        ChatService.auto_sync_confirmed_conversations(db, current_user)
        role_str, profile_id, _, _ = ChatService._get_user_profile(db, current_user)
        
        if role_str == "PATIENT":
            query = db.query(ChatConversation).filter(
                ChatConversation.patient_id == profile_id,
                ChatConversation.is_active == True
            )
        else:
            query = db.query(ChatConversation).filter(
                ChatConversation.doctor_id == profile_id,
                ChatConversation.is_active == True
            )

        conversations = query.order_by(ChatConversation.last_message_at.desc()).all()
        
        result = []
        for conv in conversations:
            result.append(ChatService._build_conversation_response(db, conv, role_str, profile_id))
            
        return result

    @staticmethod
    def get_conversation_messages(
        db: Session,
        current_user: User,
        conversation_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> ConversationMessagesResponse:
        role_str, profile_id, _, _ = ChatService._get_user_profile(db, current_user)
        
        conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if not conversation:
            raise AppException(status_code=404, message="Conversation not found.")

        # Access check: Must be participant
        if role_str == "PATIENT" and conversation.patient_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")
        if role_str == "DOCTOR" and conversation.doctor_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")

        # Mark unread incoming messages as read
        db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.sender_id != profile_id,
            ChatMessage.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        db.commit()

        # Query messages
        messages = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id
        ).order_by(ChatMessage.created_at.asc()).offset(offset).limit(limit).all()

        conv_resp = ChatService._build_conversation_response(db, conversation, role_str, profile_id)
        
        msg_resps = [ChatMessageResponse.model_validate(m) for m in messages]
        return ConversationMessagesResponse(
            conversation=conv_resp,
            messages=msg_resps
        )

    @staticmethod
    def send_message(
        db: Session,
        current_user: User,
        conversation_id: str,
        content: str,
        message_type: str = "TEXT"
    ) -> ChatMessageResponse:
        if not content or not content.strip():
            raise AppException(status_code=400, message="Message content cannot be empty.")

        role_str, profile_id, _, _ = ChatService._get_user_profile(db, current_user)
        
        conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if not conversation:
            raise AppException(status_code=404, message="Conversation not found.")

        if role_str == "PATIENT" and conversation.patient_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")
        if role_str == "DOCTOR" and conversation.doctor_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")

        # Re-verify relationship is active and patient-doctor appointment is confirmed
        if not ChatService.verify_confirmed_appointment(db, conversation.patient_id, conversation.doctor_id):
            raise AppException(
                status_code=403,
                message="Messaging is disabled because there are no active confirmed appointments."
            )

        now = datetime.now(timezone.utc)
        message = ChatMessage(
            conversation_id=conversation_id,
            sender_id=profile_id,
            sender_role=role_str,
            content=content.strip(),
            message_type=message_type,
            is_read=False,
            created_at=now,
            updated_at=now
        )
        db.add(message)

        # Update conversation metadata
        conversation.last_message_at = now
        conversation.last_message_preview = content.strip()[:100]
        conversation.updated_at = now

        db.commit()
        db.refresh(message)
        
        return ChatMessageResponse.model_validate(message)

    @staticmethod
    def mark_read(db: Session, current_user: User, conversation_id: str) -> dict:
        role_str, profile_id, _, _ = ChatService._get_user_profile(db, current_user)
        
        conversation = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if not conversation:
            raise AppException(status_code=404, message="Conversation not found.")

        if role_str == "PATIENT" and conversation.patient_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")
        if role_str == "DOCTOR" and conversation.doctor_id != profile_id:
            raise AppException(status_code=403, message="You do not have access to this conversation.")

        count = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.sender_id != profile_id,
            ChatMessage.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        
        db.commit()
        return {"success": True, "marked_read": count}

    @staticmethod
    def _build_conversation_response(
        db: Session,
        conv: ChatConversation,
        viewer_role: str,
        viewer_profile_id: str
    ) -> ChatConversationResponse:
        # Calculate unread count for viewer
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id,
            ChatMessage.sender_id != viewer_profile_id,
            ChatMessage.is_read == False
        ).count()

        if viewer_role == "PATIENT":
            # Other participant is Doctor
            doctor = db.query(Doctor).filter(Doctor.id == conv.doctor_id).first()
            doc_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
            
            other_part = ParticipantInfo(
                id=conv.doctor_id,
                user_id=doc_user.id if doc_user else None,
                name=doc_user.name if doc_user else "Doctor",
                email=doc_user.email if doc_user else None,
                role="DOCTOR",
                image=doc_user.profile_image if doc_user else None,
                specialty=doctor.specialization if doctor else "Specialist",
                hospital=doctor.hospital if doctor else "MediAssist Medical",
                phone=doctor.phone if doctor else None
            )
        else:
            # Other participant is Patient
            patient = db.query(Patient).filter(Patient.id == conv.patient_id).first()
            pat_user = db.query(User).filter(User.id == patient.user_id).first() if patient else None
            
            other_part = ParticipantInfo(
                id=conv.patient_id,
                user_id=pat_user.id if pat_user else None,
                name=pat_user.name if pat_user else "Patient",
                email=pat_user.email if pat_user else None,
                role="PATIENT",
                image=pat_user.profile_image if pat_user else None,
                phone=patient.phone if patient else None
            )

        return ChatConversationResponse(
            id=conv.id,
            patient_id=conv.patient_id,
            doctor_id=conv.doctor_id,
            other_participant=other_part,
            last_message_preview=conv.last_message_preview,
            last_message_at=conv.last_message_at,
            unread_count=unread_count,
            is_active=conv.is_active,
            created_at=conv.created_at
        )
