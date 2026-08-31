from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class GoogleLoginRequest(BaseModel):
    authorization_code: Optional[str] = None
    id_token: Optional[str] = None
    dev_email: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    google_sub: Optional[str] = None
    name: str
    email: str
    profile_image: Optional[str] = None
    role: str
    is_active: bool
    is_onboarded: bool

    class Config:
        from_attributes = True

class AuthTokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GoogleLoginResponse(BaseModel):
    success: bool = True
    message: str
    data: AuthTokenData

class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str

class MedicationSchema(BaseModel):
    id: Optional[str] = None
    name: str
    dosage: str
    frequency: str

class AllergySchema(BaseModel):
    id: Optional[str] = None
    name: str

class PatientOnboardingRequest(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = "India"
    maritalStatus: Optional[str] = "Married"
    allergies: Optional[Any] = None
    conditions: Optional[Any] = None
    medications: Optional[Any] = None
    chronicConditions: Optional[str] = None
    currentMedications: Optional[str] = None
    primaryPhysician: Optional[str] = None
    emergencyContact: Optional[EmergencyContactSchema] = None
    preferences: List[str] = []
    language: Optional[str] = "English"

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None

class RegisterResponse(BaseModel):
    message: str
    user: UserResponse
