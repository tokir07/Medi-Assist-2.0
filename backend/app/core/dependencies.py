from typing import List, Callable
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, UserRole, Patient
from app.core.security import decode_access_token
from app.utils.exceptions import AppException

bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Authentication required"
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Invalid or expired access token"
        )
    
    user_id = payload.get("id") or payload.get("sub")
    email = payload.get("email")
    
    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        
    if not user:
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="User account not found"
        )
        
    if not user.is_active:
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Your account has been disabled. Please contact the administrator."
        )
        
    return user

def get_current_patient(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Patient:
    role_str = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    if role_str != "PATIENT":
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Access denied: Only patients can access this resource"
        )
    
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        patient = Patient(user_id=current_user.id)
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return patient

def require_roles(allowed_roles: List[UserRole]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        role_str = user_role.value if isinstance(user_role, UserRole) else str(user_role)
        allowed_strs = [r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles]
        
        if role_str not in allowed_strs:
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                message="You do not have permission to access this resource"
            )
        return current_user
    return role_checker
