import request from './client';

export async function getConfig(key: string) {
  return request<{ key: string; value: string }>('/config?key=' + encodeURIComponent(key));
}

export async function setConfig(key: string, value: string) {
  const form = new FormData();
  form.append('key', key);
  form.append('value', value);
  return request('/config/', { method: 'POST', formData: form });
}

export async function getAllConfig() {
  return request<Record<string, string>>('/config/all');
}

export interface SystemStatus {
  version: string;
  title: string;
  logo: string;
  is_initialized: boolean;
}

export async function status() {
  return request<SystemStatus>('/config/status');
}
