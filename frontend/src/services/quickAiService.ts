import { api } from './api';
import type { QuickAIResponse } from '../types/quickAi';

export const quickAiService = {
  async askQuickAI(message: string): Promise<QuickAIResponse> {
    const response = await api.post<QuickAIResponse>('/ai/quick-chat', { message });
    return response.data;
  },
};
