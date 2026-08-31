export interface EmergencyContact {
  name?: string | null;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface PatientProfile {
  id: string;
  full_name: string;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  blood_group?: string | null;
  phone?: string | null;
  email: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  marital_status?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  current_medications?: string | null;
  primary_physician?: string | null;
  primary_physician_specialty?: string | null;
  abha_id?: string | null;
  emergency_contact?: EmergencyContact | null;
  profile_photo_url?: string | null;
  member_since?: string | null;
  last_login?: string | null;
  account_status?: string | null;
  kyc_verified?: boolean;
}

export interface ProfileUpdatePayload {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  marital_status?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  primary_physician?: string;
  primary_physician_specialty?: string;
  emergency_contact?: EmergencyContact;
  profile_photo_url?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export type ProfileNavTab = 'Personal Information' | 'Security' | 'Preferences' | 'Connected Accounts';
