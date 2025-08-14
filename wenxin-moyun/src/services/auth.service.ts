import apiClient from './api';
import { getItem, setItem, removeItem } from '../utils/storageUtils';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.access_token) {
      setItem('access_token', response.data.access_token);
    }
    
    return response.data;
  }

  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  }

  logout(): void {
    removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!getItem('access_token');
  }
}

export default new AuthService();