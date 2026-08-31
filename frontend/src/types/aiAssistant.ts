export interface AIAction {
  label: string;
  route: string;
}

export interface StructuredReviewPayload {
  chief_complaint?: string;
  onset?: string;
  severity?: string;
  location?: string;
  associated_symptoms?: string[];
  medications_mentioned?: string[];
  provenance?: Record<string, string>;
  red_flag?: boolean;
  reason?: string;
  report?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  message_type?: 'text' | 'action' | 'review_card' | 'red_flag_alert' | 'report';
  structured_payload?: StructuredReviewPayload | null;
  action?: AIAction | null;
  status?: 'sent' | 'delivered' | 'read';
  liked?: boolean | null;
  model?: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  snippet: string;
  timestamp: string;
  consultation_state?: 'IN_PROGRESS' | 'READY_FOR_REVIEW' | 'PATIENT_REVIEW' | 'CONFIRMED' | 'COMPLETED';
  structured_context?: Record<string, any> | null;
  clinical_summary?: string | null;
  is_pinned?: boolean;
  messages: ChatMessage[];
}

export interface ClinicalSummary {
  id: string;
  title: string;
  date_from: string;
  date_to: string;
  conversations_count: number;
  main_concerns: string[];
  symptoms_mentioned?: string[];
  medications_mentioned?: string[];
  patient_questions?: string[];
  ai_guidance?: string;
  follow_up_recommendations?: string;
  unresolved_questions?: string;
  doctor_readable_report: string;
  is_shared_with_doctor?: boolean;
  created_at: string;
}

export interface GenerateSummaryPayload {
  conversation_ids?: string[];
  date_from: string;
  date_to: string;
  summary_type?: string;
}

export interface AIQuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  prompt: string;
}

export interface HealthTopic {
  id: string;
  name: string;
  prompt: string;
}
