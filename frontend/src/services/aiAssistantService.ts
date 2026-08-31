import { api } from './api';
import type {
  ConversationThread,
  ChatMessage,
  ClinicalSummary,
  GenerateSummaryPayload,
  AIQuickAction,
  HealthTopic,
} from '../types/aiAssistant';

export const aiAssistantService = {
  // 1. Get all conversations (supports search and date filter)
  async getConversations(search?: string, filterDate?: string): Promise<ConversationThread[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterDate) params.append('filter_date', filterDate);

    const res = await api.get<ConversationThread[]>(`/ai/conversations?${params.toString()}`);
    return res.data;
  },

  // 2. Create a new conversation thread
  async createConversation(title?: string, initialMessage?: string): Promise<ConversationThread> {
    const res = await api.post<ConversationThread>('/ai/conversations', {
      title: title || 'New Consultation',
      initial_message: initialMessage,
    });
    return res.data;
  },

  // 3. Get details of a single conversation
  async getConversationDetails(conversationId: string): Promise<ConversationThread> {
    const res = await api.get<ConversationThread>(`/ai/conversations/${conversationId}`);
    return res.data;
  },

  // 4. Send message to a conversation and get real AI response
  async sendMessage(conversationId: string, message: string): Promise<{
    id: string;
    conversation_id: string;
    sender: 'ai';
    text: string;
    message_type?: string;
    structured_payload?: any;
    consultation_state?: string;
    structured_context?: any;
    timestamp: string;
    action?: any;
    model?: string;
    latency_ms?: number;
  }> {
    const res = await api.post(`/ai/conversations/${conversationId}/messages`, { message });
    return res.data;
  },

  // 4b. Stream AI response with Server-Sent Events (SSE) (TTFT < 300ms)
  async streamMessage(
    conversationId: string,
    message: string,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const token = localStorage.getItem('mediassist_token');
    const response = await fetch(`/api/ai/conversations/${conversationId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    if (reader) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                fullText += data.content;
                onChunk(fullText);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    }
    return fullText;
  },

  // 5. Correct extracted consultation fields
  async correctConsultationContext(conversationId: string, corrections: Record<string, any>): Promise<any> {
    const res = await api.post(`/ai/conversations/${conversationId}/correct`, { corrections });
    return res.data;
  },

  // 6. Confirm consultation and generate clinical history report
  async confirmConsultation(conversationId: string): Promise<any> {
    const res = await api.post(`/ai/conversations/${conversationId}/confirm`);
    return res.data;
  },

  // 7. Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/ai/conversations/${conversationId}`);
  },

  // 8. Generate Clinical Summary across dates / conversations
  async generateSummary(payload: GenerateSummaryPayload): Promise<ClinicalSummary> {
    const res = await api.post<ClinicalSummary>('/ai/summaries', payload);
    return res.data;
  },

  // 9. List all generated summaries
  async listSummaries(): Promise<ClinicalSummary[]> {
    const res = await api.get<ClinicalSummary[]>('/ai/summaries');
    return res.data;
  },

  // 10. Get summary details
  async getSummaryDetails(summaryId: string): Promise<ClinicalSummary> {
    const res = await api.get<ClinicalSummary>(`/ai/summaries/${summaryId}`);
    return res.data;
  },

  // 11. Share summary with doctor
  async shareSummary(summaryId: string, doctorId?: string): Promise<{ status: string; message: string }> {
    const res = await api.post(`/ai/summaries/${summaryId}/share`, { doctor_id: doctorId });
    return res.data;
  },

  // Static Prompt Helpers & Quick Actions for UI
  getQuickActions(): AIQuickAction[] {
    return [
      {
        id: 'qa-1',
        title: 'Check Symptoms',
        subtitle: 'Adaptive pre-consultation triage',
        icon: 'Stethoscope',
        prompt: 'I have been having a headache since yesterday with mild dizziness.',
      },
      {
        id: 'qa-2',
        title: 'Medication Review',
        subtitle: 'Dosage, side effects & schedule',
        icon: 'Pill',
        prompt: 'What are my active medications and their prescribed dosages?',
      },
      {
        id: 'qa-3',
        title: 'Upcoming Visits',
        subtitle: 'Review appointment schedules',
        icon: 'Calendar',
        prompt: 'What are my upcoming scheduled doctor appointments?',
      },
      {
        id: 'qa-4',
        title: 'Lab Report Review',
        subtitle: 'Understand medical test results',
        icon: 'FileText',
        prompt: 'How do I interpret my recent laboratory test results?',
      },
    ];
  },

  getHealthTopics(): HealthTopic[] {
    return [
      { id: 'ht-1', name: 'Headache & Migraine', prompt: 'I have had a throbbing frontal headache since morning with sensitivity to light.' },
      { id: 'ht-2', name: 'Fever & Chills', prompt: 'I started having a fever of around 101°F last night along with body aches.' },
      { id: 'ht-3', name: 'Stomach & Digestion', prompt: 'I am experiencing cramping abdominal pain and mild nausea after meals.' },
      { id: 'ht-4', name: 'Cough & Throat', prompt: 'I have a dry persistent cough that started 3 days ago.' },
    ];
  },
};
