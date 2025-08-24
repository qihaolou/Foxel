import request from './client';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: async (username: string, password: string, email?: string, full_name?: string): Promise<any> => {
    return request('/auth/register', {
      method: 'POST',
      json: { username, password, email, full_name },
    });
  },
  login: async (payload: LoginPayload) => {
    const form = new URLSearchParams();
    form.append('username', payload.username);
    form.append('password', payload.password);
    try {
      return await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: form,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } catch (e) {
      console.error('[authApi.login] error:', e);
      throw e;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};
