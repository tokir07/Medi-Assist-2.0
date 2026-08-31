export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  is_active?: boolean;
  is_onboarded?: boolean;
  profile_image?: string | null;
  google_sub?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<UserRole>;
  loginWithGoogle: (devEmail?: string) => Promise<UserRole>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<UserRole | void>;
  logout: () => void;
  demoLogin: (email: string, password?: string) => Promise<UserRole>;
}

