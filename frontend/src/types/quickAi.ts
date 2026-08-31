export interface QuickAIAction {
  label: string;
  route: string;
}

export interface QuickAIMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  action?: QuickAIAction;
  suggestedQuestions?: string[];
  status?: 'sending' | 'sent' | 'error';
}

export interface QuickAIResponse {
  message: string;
  action?: QuickAIAction;
  suggested_questions?: string[];
}
