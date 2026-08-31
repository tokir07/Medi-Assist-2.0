export type SettingsNavTab =
  | 'Account'
  | 'Preferences'
  | 'Notifications'
  | 'Privacy & Security'
  | 'Connected Apps'
  | 'About';

export interface UserSettings {
  id: string;
  user_id: string;
  language: string;
  time_zone: string;
  appearance: string;
  auto_save: boolean;
  low_data_mode: boolean;
  download_wifi_only: boolean;
  two_factor_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  appointment_reminders: boolean;
  medication_reminders: boolean;
  health_tip_notifications: boolean;
}

export interface UserSettingsUpdatePayload {
  language?: string;
  time_zone?: string;
  appearance?: string;
  auto_save?: boolean;
  low_data_mode?: boolean;
  download_wifi_only?: boolean;
  two_factor_enabled?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  appointment_reminders?: boolean;
  medication_reminders?: boolean;
  health_tip_notifications?: boolean;
}

export interface AccountOverview {
  member_since: string;
  last_login: string;
  account_status: string;
  email_verified: boolean;
  phone_verified: boolean;
  kyc_verified: boolean;
}

export interface LoginHistoryItem {
  id: string;
  device: string;
  ip_address: string;
  location: string;
  status: string;
  logged_at: string;
}

export interface DeviceSessionItem {
  id: string;
  device_name: string;
  browser: string;
  location: string;
  is_current: boolean;
  last_active: string;
}
