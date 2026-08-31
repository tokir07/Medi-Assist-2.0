from typing import Optional
from pydantic import BaseModel, Field

class EmergencyContactSchema(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class PatientProfileResponse(BaseModel):
    id: str
    full_name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"
    marital_status: Optional[str] = "Married"
    allergies: Optional[str] = "Pollen, Penicillin"
    chronic_conditions: Optional[str] = "None"
    current_medications: Optional[str] = "Atorvastatin 10mg (Daily)"
    primary_physician: Optional[str] = "Dr. Priya Sharma"
    primary_physician_specialty: Optional[str] = "General Physician"
    abha_id: Optional[str] = None
    emergency_contact: Optional[EmergencyContactSchema] = None
    profile_photo_url: Optional[str] = None
    member_since: Optional[str] = None
    last_login: Optional[str] = None
    account_status: Optional[str] = "Active"
    kyc_verified: Optional[bool] = True

class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    marital_status: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    primary_physician: Optional[str] = None
    primary_physician_specialty: Optional[str] = None
    emergency_contact: Optional[EmergencyContactSchema] = None
    profile_photo_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
