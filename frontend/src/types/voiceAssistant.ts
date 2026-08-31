export type VoiceStage = 'speak' | 'listening' | 'processing' | 'responding';

export interface VoiceHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  duration?: string;
  transcript?: string;
  response?: string;
}

export interface VoiceTipItem {
  id: string;
  title: string;
  description: string;
  icon: 'mic' | 'clock' | 'volume' | 'shield';
}

export interface SuggestedVoicePrompt {
  id: string;
  text: string;
}
