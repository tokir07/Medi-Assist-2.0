export interface HealthTipItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url?: string | null;
  read_time: string;
  is_featured: boolean;
  is_popular: boolean;
  popularity_rank?: number | null;
  author: string;
  source?: string | null;
  reviewed_by?: string | null;
  status?: string | null;
  tags?: string | null;
  is_saved: boolean;
  recommendation_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HealthTipListResponse {
  tips: HealthTipItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CategoryCountItem {
  category: string;
  count: number;
  icon?: string | null;
  description?: string | null;
}

export interface CategoryCountResponse {
  categories: CategoryCountItem[];
  total_all_tips: number;
}

export interface DailyTipReminderSettings {
  is_enabled: boolean;
  preferred_time: string;
  topics?: string[];
}

export interface HealthActivityData {
  saved_tips_count: number;
  recently_viewed_count: number;
  today_tip_title?: string | null;
  active_interests: string[];
}

export interface PersonalizePreferencesPayload {
  goals?: string[];
  topics?: string[];
  dietary_preference?: string | null;
  activity_level?: string | null;
}
