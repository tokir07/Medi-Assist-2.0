import { api } from './api';

export interface ParticipantInfo {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  role: 'PATIENT' | 'DOCTOR';
  image?: string;
  specialty?: string;
  hospital?: string;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'PATIENT' | 'DOCTOR' | 'SYSTEM';
  content: string;
  message_type: 'TEXT' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatConversation {
  id: string;
  patient_id: string;
  doctor_id: string;
  other_participant: ParticipantInfo;
  last_message_preview?: string;
  last_message_at: string;
  unread_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ConversationMessagesResponse {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

export const chatService = {
  async getConversations(): Promise<ChatConversation[]> {
    const res = await api.get<ChatConversation[]>('/chat/conversations');
    return res.data;
  },

  async openConversation(doctorId?: string, patientId?: string): Promise<ChatConversation> {
    const res = await api.post<ChatConversation>('/chat/conversations/open', {
      doctor_id: doctorId,
      patient_id: patientId,
    });
    return res.data;
  },

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ConversationMessagesResponse> {
    const res = await api.get<ConversationMessagesResponse>(`/chat/conversations/${conversationId}/messages`, {
      params: { limit, offset },
    });
    return res.data;
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const res = await api.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      content,
      message_type: 'TEXT',
    });
    return res.data;
  },

  async markRead(conversationId: string): Promise<{ success: boolean; marked_read: number }> {
    const res = await api.patch<{ success: boolean; marked_read: number }>(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },
};
