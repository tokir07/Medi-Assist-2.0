export type ReminderTab =
  | 'All Reminders'
  | 'Medications'
  | 'Appointments'
  | 'Health Tasks'
  | 'Custom';

export type ReminderType =
  | 'Medication'
  | 'Appointment'
  | 'Health Task'
  | 'Custom';

export type ReminderStatus =
  | 'Upcoming'
  | 'Pending'
  | 'Due'
  | 'Completed'
  | 'Missed'
  | 'Skipped'
  | 'Dismissed'
  | 'Snoozed'
  | 'Cancelled';

export type RecurrenceType =
  | 'Once'
  | 'Daily'
  | 'Weekly'
  | 'Monthly';

export interface ReminderItem {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  prescription_id?: string | null;
  reminder_type: ReminderType | string;
  title: string;
  subtitle?: string | null;
  notes?: string | null;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent' | string;
  notification_preference?: 'IN_APP' | 'PUSH' | 'EMAIL' | 'ALL' | string;
  time_str: string;
  date_str?: string | null;
  recurrence: RecurrenceType | string;
  status: ReminderStatus | string;
  is_completed: boolean;
  completed_at?: string | null;
  snoozed_until?: string | null;
  icon_type?: string | null;
  color_theme?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReminderSummaryStats {
  all_active_count: number;
  medications_active_count: number;
  appointments_upcoming_count: number;
  health_tasks_active_count: number;
  completed_this_month_count: number;
}

export interface ReminderGroupedListResponse {
  today_reminders: ReminderItem[];
  upcoming_reminders: ReminderItem[];
  today_count: number;
  upcoming_count: number;
  total_count: number;
}

export interface ReminderCalendarDay {
  date: string;
  has_medication: boolean;
  has_appointment: boolean;
  has_task: boolean;
  has_completed: boolean;
  total_count: number;
}

export interface ReminderCalendarMonthData {
  year: number;
  month: number;
  days: ReminderCalendarDay[];
}

export interface ReminderHistoryItem {
  id: string;
  reminder_id?: string | null;
  reminder_title: string;
  reminder_type: string;
  action: string;
  scheduled_time: string;
  logged_at: string;
}

export interface ReminderHistoryResponse {
  logs: ReminderHistoryItem[];
  total_count: number;
}

export interface ReminderCreatePayload {
  reminder_type: string;
  title: string;
  subtitle?: string;
  notes?: string;
  priority?: string;
  notification_preference?: string;
  time_str: string;
  date_str?: string;
  recurrence?: string;
  appointment_id?: string;
  prescription_id?: string;
  icon_type?: string;
  color_theme?: string;
}

export interface ReminderUpdatePayload {
  title?: string;
  subtitle?: string;
  notes?: string;
  priority?: string;
  notification_preference?: string;
  time_str?: string;
  date_str?: string;
  recurrence?: string;
  status?: string;
  is_completed?: boolean;
  icon_type?: string;
  color_theme?: string;
}
