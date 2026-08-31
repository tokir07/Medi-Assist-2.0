export type AppointmentTab =
  | 'Upcoming'
  | 'Past'
  | 'Cancelled'
  | 'All';

export interface LinkedRecordItem {
  id: string;
  title: string;
  category: string;
  file_name?: string | null;
  record_date?: string | null;
}

export interface LinkedPrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  doctor_name: string;
  prescribed_date?: string | null;
}

export interface DoctorHealthMessage {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  appointment_id?: string | null;
  doctor_name: string;
  doctor_specialty: string;
  doctor_image?: string | null;
  hospital: string;
  message_type: 'CLINICAL_ADVICE' | 'LAB_FOLLOWUP' | 'CARE_INSTRUCTION' | 'PRESCRIPTION_NOTE' | 'GENERAL' | string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentItem {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  doctor_name: string;
  doctor_specialty: string;
  doctor_image?: string | null;
  hospital: string;
  hospital_address?: string | null;
  appointment_type: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // e.g. "10:30 AM"
  duration_minutes: number;
  mode: string; // In-Person, Video Call
  session_name?: string | null;
  consultation_link?: string | null;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Rescheduled' | string;
  notes?: string | null;
  preparation_instructions?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;

  linked_records?: LinkedRecordItem[];
  linked_prescriptions?: LinkedPrescriptionItem[];
  doctor_messages?: DoctorHealthMessage[];

  created_at: string;
  updated_at: string;
}

export interface AppointmentSummaryStats {
  upcoming_count: number;
  this_month_count: number;
  completed_count: number;
  cancelled_count: number;
}

export interface AppointmentListResponse {
  appointments: AppointmentItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experience: number;
  rating: number;
  image_url?: string | null;
  available_days: string[];
}

export interface AvailableSlotsResponse {
  date: string;
  doctor_name: string;
  slots: string[];
}

export interface HospitalItem {
  id: string;
  name: string;
  location: string;
  departments: string[];
  contact: string;
  rating: number;
}

export interface CalendarDayEvent {
  date: string; // YYYY-MM-DD
  has_upcoming: boolean;
  has_completed: boolean;
  has_cancelled: boolean;
  count: number;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  days: CalendarDayEvent[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  action_text: string;
  specialty: string;
  icon_type: string;
}

export interface CreateAppointmentPayload {
  doctor_id?: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_image?: string;
  hospital: string;
  hospital_address?: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  mode?: string;
  session_name?: string;
  notes?: string;
  preparation_instructions?: string;
}

export interface RescheduleAppointmentPayload {
  new_date: string;
  new_time: string;
  reason?: string;
}

export interface CancelAppointmentPayload {
  cancellation_reason?: string;
}

export interface SendDoctorMessagePayload {
  appointment_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  hospital?: string;
  message_type?: string;
  title: string;
  content: string;
  priority?: string;
}
