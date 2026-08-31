import { api } from './api';
import type { AuthResponse, User, ApiResponse } from '../types/auth';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse> | AuthResponse>('/auth/login', { email, password });
    if ('data' in response.data && response.data.data && 'access_token' in (response.data.data as any)) {
      return response.data.data as AuthResponse;
    }
    return response.data as AuthResponse;
  },

  async loginWithGoogle(payload: {
    authorization_code?: string;
    id_token?: string;
    dev_email?: string;
  }): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', payload);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Google sign-in failed');
  },

  async register(name: string, email: string, password: string, phone?: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse> | AuthResponse>('/auth/register', { name, email, password, phone });
    if ('data' in response.data && response.data.data && 'access_token' in (response.data.data as any)) {
      return response.data.data as AuthResponse;
    }
    return response.data as AuthResponse;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Test endpoints for demonstrating RBAC authorization
  async testPatientEndpoint(): Promise<any> {
    const response = await api.get('/patient/test');
    return response.data;
  },

  async testDoctorEndpoint(): Promise<any> {
    const response = await api.get('/doctor/test');
    return response.data;
  },

  async testAdminEndpoint(): Promise<any> {
    const response = await api.get('/admin/test');
    return response.data;
  }
};

