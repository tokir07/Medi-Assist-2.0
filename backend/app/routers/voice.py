import os
import time
import base64
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Patient
from app.models.patient_portal import Consultation, VoiceSession, VoiceMessage, VoiceSessionStatus
from app.core.dependencies import get_current_patient
from app.core.config import settings
from app.schemas.voice import VoiceSessionResponse, TranscribeRequest, TranscribeResponse
from app.services.voice_service import stt_service
from app.utils.exceptions import AppException

logger = logging.getLogger("mediassist.voice")

router = APIRouter(tags=["Voice Interaction"])

ALLOWED_AUDIO_EXTENSIONS = {".m4a", ".wav", ".mp3", ".ogg", ".webm", ".aac", ".flac", ".mp4", ".caf"}
ALLOWED_CONTENT_TYPES = {
    "audio/m4a", "audio/mp4", "audio/wav", "audio/x-wav", "audio/wave",
    "audio/mpeg", "audio/mp3", "audio/aac", "audio/ogg", "audio/webm",
    "audio/x-m4a", "application/octet-stream", "multipart/form-data"
}

@router.post("/v1/consultation/{id}/voice/start", response_model=VoiceSessionResponse)
@router.post("/consultation/{id}/voice/start", response_model=VoiceSessionResponse)
def start_voice_session(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    consultation = db.query(Consultation).filter(Consultation.id == id).first()
    if not consultation:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Consultation not found")
    if consultation.patient_id != current_patient.id:
        raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Access denied to this consultation")

    session = VoiceSession(
        consultation_id=id,
        patient_id=current_patient.id,
        language=consultation.language,
        status=VoiceSessionStatus.LISTENING
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return VoiceSessionResponse(
        session_id=session.id,
        consultation_id=id,
        language=session.language,
        status=session.status.value
    )

@router.post("/v1/consultation/{id}/voice/stop", response_model=VoiceSessionResponse)
@router.post("/consultation/{id}/voice/stop", response_model=VoiceSessionResponse)
def stop_voice_session(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    session = db.query(VoiceSession).filter(
        VoiceSession.consultation_id == id,
        VoiceSession.patient_id == current_patient.id
    ).order_by(VoiceSession.started_at.desc()).first()

    if not session:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="No active voice session found")

    session.status = VoiceSessionStatus.COMPLETED
    session.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    return VoiceSessionResponse(
        session_id=session.id,
        consultation_id=id,
        language=session.language,
        status=session.status.value
    )

@router.post("/v1/consultation/{id}/voice/pause", response_model=VoiceSessionResponse)
@router.post("/consultation/{id}/voice/pause", response_model=VoiceSessionResponse)
def pause_voice_session(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    session = db.query(VoiceSession).filter(
        VoiceSession.consultation_id == id,
        VoiceSession.patient_id == current_patient.id
    ).order_by(VoiceSession.started_at.desc()).first()

    if not session:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="No active voice session found")

    session.status = VoiceSessionStatus.PAUSED
    db.commit()
    db.refresh(session)

    return VoiceSessionResponse(
        session_id=session.id,
        consultation_id=id,
        language=session.language,
        status=session.status.value
    )

@router.post("/v1/consultation/{id}/voice/resume", response_model=VoiceSessionResponse)
@router.post("/consultation/{id}/voice/resume", response_model=VoiceSessionResponse)
def resume_voice_session(
    id: str,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    session = db.query(VoiceSession).filter(
        VoiceSession.consultation_id == id,
        VoiceSession.patient_id == current_patient.id
    ).order_by(VoiceSession.started_at.desc()).first()

    if not session:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="No active voice session found")

    session.status = VoiceSessionStatus.LISTENING
    db.commit()
    db.refresh(session)

    return VoiceSessionResponse(
        session_id=session.id,
        consultation_id=id,
        language=session.language,
        status=session.status.value
    )

@router.post("/v1/consultation/{id}/voice/transcribe", response_model=TranscribeResponse)
@router.post("/consultation/{id}/voice/transcribe", response_model=TranscribeResponse)
async def transcribe_voice_audio(
    id: str,
    request: Request,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    t_start = time.time()

    # 1. Authorize & lookup consultation
    t_lookup_start = time.time()
    consultation = db.query(Consultation).filter(Consultation.id == id).first()
    if not consultation:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, message="Consultation not found")
    if consultation.patient_id != current_patient.id:
        raise AppException(status_code=status.HTTP_403_FORBIDDEN, message="Access denied to this consultation")
    lookup_ms = (time.time() - t_lookup_start) * 1000

    audio_bytes = b""
    filename = "audio.m4a"
    target_language = consultation.language or "en"

    content_type_header = request.headers.get("content-type", "").lower()

    if "multipart/form-data" in content_type_header or "application/x-www-form-urlencoded" in content_type_header:
        form = await request.form()
        file = form.get("file")
        if form.get("language"):
            target_language = str(form.get("language"))

        if file and hasattr(file, "read"):
            filename = getattr(file, "filename", "audio.m4a") or "audio.m4a"
            ext = os.path.splitext(filename)[1].lower()
            file_ct = (getattr(file, "content_type", "") or "").lower().split(";")[0].strip()

            if ext and ext not in ALLOWED_AUDIO_EXTENSIONS:
                raise AppException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    message=f"Unsupported audio format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
                )

            if file_ct and file_ct not in ALLOWED_CONTENT_TYPES and not file_ct.startswith("audio/"):
                raise AppException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    message=f"Unsupported audio content-type '{file_ct}'."
                )

            audio_bytes = await file.read()
    elif "application/json" in content_type_header:
        try:
            json_body = await request.json()
            if json_body.get("language"):
                target_language = json_body.get("language")
            b64_data = json_body.get("audio_base64", "")
            if b64_data:
                # Handle potential base64 padding issues gracefully
                missing_padding = len(b64_data) % 4
                if missing_padding:
                    b64_data += '=' * (4 - missing_padding)
                try:
                    audio_bytes = base64.b64decode(b64_data)
                except Exception:
                    audio_bytes = b64_data.encode("utf-8")
                filename = "audio.wav"
        except Exception as json_err:
            raise AppException(
                status_code=status.HTTP_400_BAD_REQUEST,
                message=f"Invalid JSON payload: {json_err}"
            )
    else:
        # Raw body
        audio_bytes = await request.body()

    if not audio_bytes or len(audio_bytes) == 0:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="No audio file or audio payload provided."
        )

    # Validate audio size limit
    max_size_bytes = (settings.MAX_AUDIO_SIZE_MB or 10) * 1024 * 1024
    if len(audio_bytes) > max_size_bytes:
        raise AppException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            message=f"Audio payload size ({len(audio_bytes) / 1024 / 1024:.1f}MB) exceeds the maximum limit of {settings.MAX_AUDIO_SIZE_MB}MB."
        )

    # 3. Process transcription with STT service
    t_stt_start = time.time()
    result = stt_service.transcribe(
        audio_bytes=audio_bytes,
        filename=filename,
        language=target_language
    )
    stt_ms = (time.time() - t_stt_start) * 1000
    transcript_text = result.get("transcript", "")
    confidence = result.get("confidence", 0.98)
    duration_seconds = result.get("duration_seconds")

    # 4. Persist transcript to PostgreSQL
    t_db_start = time.time()
    session = db.query(VoiceSession).filter(
        VoiceSession.consultation_id == id,
        VoiceSession.patient_id == current_patient.id
    ).order_by(VoiceSession.started_at.desc()).first()

    if not session:
        session = VoiceSession(
            consultation_id=id,
            patient_id=current_patient.id,
            language=target_language,
            status=VoiceSessionStatus.COMPLETED,
            transcript=transcript_text,
            ended_at=datetime.now(timezone.utc)
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    else:
        session.transcript = (session.transcript + "\n" + transcript_text) if session.transcript else transcript_text
        session.status = VoiceSessionStatus.COMPLETED
        session.ended_at = datetime.now(timezone.utc)

    # Save VoiceMessage
    last_vmsg = db.query(VoiceMessage).filter(
        VoiceMessage.voice_session_id == session.id
    ).order_by(VoiceMessage.sequence_number.desc()).first()
    seq_user = (last_vmsg.sequence_number + 1) if last_vmsg else 1

    vmsg = VoiceMessage(
        voice_session_id=session.id,
        role="user",
        content=transcript_text,
        sequence_number=seq_user,
        message_type="voice_transcription",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(vmsg)

    db.commit()
    db.refresh(session)
    db_ms = (time.time() - t_db_start) * 1000

    total_ms = (time.time() - t_start) * 1000

    logger.info(
        f"[VOICE] consultation_id={id} bytes={len(audio_bytes)} "
        f"lookup_ms={lookup_ms:.1f} stt_ms={stt_ms:.1f} db_ms={db_ms:.1f} total_ms={total_ms:.1f}"
    )

    return TranscribeResponse(
        success=True,
        transcript=transcript_text,
        consultation_id=id,
        confidence=confidence,
        duration_seconds=duration_seconds
    )

