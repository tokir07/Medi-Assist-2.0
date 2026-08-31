from typing import Optional
from sqlalchemy.orm import Session
from app.database.models import User, UserRole
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.exceptions import AppException
from fastapi import status

class UserService:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower()).first()

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        return db.query(User).filter(User.id == str(user_id)).first()

    @staticmethod
    def create_user(
        db: Session,
        name: str,
        email: str,
        password: str,
        role: UserRole = UserRole.PATIENT,
        is_active: bool = True
    ) -> User:
        existing = UserService.get_by_email(db, email)
        if existing:
            raise AppException(
                status_code=status.HTTP_409_CONFLICT,
                message="Email already registered"
            )
            
        hashed_password = get_password_hash(password)
        db_user = User(
            name=name.strip(),
            email=email.lower().strip(),
            password_hash=hashed_password,
            role=role,
            is_active=is_active
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
