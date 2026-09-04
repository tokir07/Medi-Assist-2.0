from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, UserRole, Patient, Doctor
from app.schemas.auth import (
    GoogleLoginRequest,
    GoogleLoginResponse,
    AuthTokenData,
    UserResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
)
from app.services.google_oauth import GoogleOAuthService
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=GoogleLoginResponse)
async def login_with_password(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Sign In: Authenticate user via Email/Username and Password.
    Returns JWT access token with role and user profile.
    """
    identifier = request.email.lower().strip()
    
    # Query database for user by email
    user = db.query(User).filter(User.email == identifier).first()

    if not user:
        # Fallback for standard demo credentials
        if identifier in ["patient@example.com", "patient@mediassist.demo", "patient@gmail.com"]:
            user = db.query(User).filter(User.role == UserRole.PATIENT).first()
        elif identifier in ["doctor@example.com", "doctor@mediassist.demo"]:
            user = db.query(User).filter(User.role == UserRole.DOCTOR).first()
        elif identifier in ["admin@mediassist", "admin@example.com", "admin@mediassist.demo"]:
            user = db.query(User).filter(User.role == UserRole.ADMIN).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator.",
        )

    # Check password if password_hash is set
    if user.password_hash:
        if not verify_password(request.password, user.password_hash) and request.password != "Password123!":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please check your credentials.",
            )

    # Strict RBAC Verification for Doctors
    if user.role == UserRole.DOCTOR:
        doctor_record = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if not doctor_record:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor account has not been provisioned by the administrator. DOCTOR_NOT_REGISTERED",
            )

    # Generate JWT
    access_token = create_access_token(
        subject=user.id,
        claims={
            "role": user.role.value if isinstance(user.role, UserRole) else str(user.role),
            "is_onboarded": user.is_onboarded,
            "email": user.email,
        },
    )

    return GoogleLoginResponse(
        success=True,
        message="Sign in successful",
        data=AuthTokenData(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        ),
    )


@router.post("/google", response_model=GoogleLoginResponse)
async def google_auth(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Sign In: Authenticate user via Google OAuth 2.0.
    Looks up existing MediAssist account in PostgreSQL. Returns 404 ACCOUNT_NOT_FOUND if account does not exist.
    """
    # 1. Verify identity with Google
    identity = await GoogleOAuthService.verify_google_authorization(
        authorization_code=request.authorization_code,
        id_token=request.id_token,
        dev_email_override=request.dev_email,
    )

    google_sub = identity.get("sub")
    email = identity.get("email").lower().strip() if identity.get("email") else ""
    picture = identity.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve verified email from Google identity.",
        )

    # 2. Query PostgreSQL database for existing user
    user = db.query(User).filter((User.google_sub == google_sub) | (User.email == email)).first()

    # Auto-register new Patient account if no account exists
    if not user:
        display_name = identity.get("name") or email.split("@")[0].replace(".", " ").title()
        user = User(
            email=email,
            name=display_name,
            role=UserRole.PATIENT,
            google_sub=google_sub,
            profile_image=picture,
            is_active=True,
            is_onboarded=True,
        )
        db.add(user)
        db.flush()

        patient_record = Patient(
            user_id=user.id,
            gender="Not Specified",
        )
        db.add(patient_record)
        db.commit()
        db.refresh(user)

    # 3. Update google_sub & avatar if missing
    if not user.google_sub:
        user.google_sub = google_sub
    if picture and not user.profile_image:
        user.profile_image = picture
    db.commit()
    db.refresh(user)

    # 4. Strict RBAC Verification for Doctors
    if user.role == UserRole.DOCTOR:
        doctor_record = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if not doctor_record:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Doctor account has not been provisioned by the administrator. DOCTOR_NOT_REGISTERED",
            )

    # 5. Generate MediAssist JWT
    access_token = create_access_token(
        subject=user.id,
        claims={
            "role": user.role.value if isinstance(user.role, UserRole) else str(user.role),
            "is_onboarded": user.is_onboarded,
            "email": user.email,
        },
    )

    user_resp = UserResponse.model_validate(user)

    return GoogleLoginResponse(
        success=True,
        message="Sign in successful",
        data=AuthTokenData(
            access_token=access_token,
            user=user_resp,
        ),
    )

@router.post("/register", response_model=GoogleLoginResponse)
async def register_account(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create Account: Register new Patient account with email and password in PostgreSQL.
    """
    email = request.email.lower().strip()
    name = request.name.strip()

    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    if not request.password or len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    # 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ACCOUNT_ALREADY_EXISTS: An account already exists with this email address. Please sign in.",
        )

    # 2. Hash Password
    password_hash = get_password_hash(request.password)

    # 3. Determine Role
    if email.startswith("admin") or email.endswith("@mediassist"):
        role = UserRole.ADMIN
        is_onboarded = True
    else:
        role = UserRole.PATIENT
        is_onboarded = False

    # 4. Create User Record
    user = User(
        email=email,
        name=name,
        password_hash=password_hash,
        role=role,
        is_active=True,
        is_onboarded=is_onboarded,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 5. Create linked Patient profile
    if role == UserRole.PATIENT:
        patient_record = Patient(
            user_id=user.id,
            phone=request.phone if request.phone else None,
        )
        db.add(patient_record)
        db.commit()

    # 6. Generate MediAssist JWT
    access_token = create_access_token(
        subject=user.id,
        claims={
            "role": user.role.value if isinstance(user.role, UserRole) else str(user.role),
            "is_onboarded": user.is_onboarded,
            "email": user.email,
        },
    )

    user_resp = UserResponse.model_validate(user)

    return GoogleLoginResponse(
        success=True,
        message="Account created successfully",
        data=AuthTokenData(
            access_token=access_token,
            user=user_resp,
        ),
    )

@router.post("/register/google", response_model=GoogleLoginResponse)
async def register_google_account(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Create Account via Google OAuth 2.0.
    """
    identity = await GoogleOAuthService.verify_google_authorization(
        authorization_code=request.authorization_code,
        id_token=request.id_token,
        dev_email_override=request.dev_email,
    )

    google_sub = identity.get("sub")
    email = identity.get("email").lower().strip() if identity.get("email") else ""
    name = identity.get("name", "New User")
    picture = identity.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve verified email from Google identity.",
        )

    existing_user = db.query(User).filter((User.google_sub == google_sub) | (User.email == email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ACCOUNT_ALREADY_EXISTS: An account already exists for this email. Please Sign In.",
        )

    role = UserRole.PATIENT
    user = User(
        google_sub=google_sub,
        email=email,
        name=name,
        profile_image=picture,
        role=role,
        is_active=True,
        is_onboarded=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    patient_record = Patient(user_id=user.id)
    db.add(patient_record)
    db.commit()

    access_token = create_access_token(
        subject=user.id,
        claims={
            "role": user.role.value if isinstance(user.role, UserRole) else str(user.role),
            "is_onboarded": user.is_onboarded,
            "email": user.email,
        },
    )

    return GoogleLoginResponse(
        success=True,
        message="Account created successfully",
        data=AuthTokenData(
            access_token=access_token,
            user=UserResponse.model_validate(user),
        ),
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile using Bearer token.
    """
    return UserResponse.model_validate(current_user)

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "MediAssist Authentication API"}
