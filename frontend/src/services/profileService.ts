import { api } from './api';
import type { PatientProfile, ProfileUpdatePayload, ChangePasswordPayload } from '../types/profile';

export const profileService = {
  // Fetch authenticated patient profile
  getProfile: async (): Promise<PatientProfile> => {
    const res = await api.get<PatientProfile>('/profile');
    return res.data;
  },

  // Update profile details
  updateProfile: async (payload: ProfileUpdatePayload): Promise<PatientProfile> => {
    const res = await api.patch<PatientProfile>('/profile', payload);
    return res.data;
  },

  // Change password
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>('/profile/change-password', payload);
    return res.data;
  },
};

