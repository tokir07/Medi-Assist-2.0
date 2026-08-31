from sqlalchemy.orm import Session
from app.services.user_service import UserService
from app.core.security import verify_password, create_access_token
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.utils.exceptions import AppException
from fastapi import status

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, request: LoginRequest) -> LoginResponse:
        user = UserService.get_by_email(db, request.email)
        
        # Generic credential error to avoid leaking email existence
        if not user or not verify_password(request.password, user.password_hash):
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                message="Invalid email or password."
            )
            
        if not user.is_active:
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                message="Your account has been disabled. Please contact the administrator."
            )

        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        token = create_access_token(
            subject=user.id,
            claims={"role": role_str, "email": user.email}
        )

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
