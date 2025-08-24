import request from './client';

export interface AutomationTask {
  id: number;
  name: string;
  event: string;
  path_pattern?: string;
  filename_regex?: string;
  processor_type: string;
  processor_config: Record<string, any>;
  enabled: boolean;
}

export type AutomationTaskCreate = Omit<AutomationTask, 'id'>;
export type AutomationTaskUpdate = Partial<AutomationTaskCreate>;

export const tasksApi = {
  list: () => request<AutomationTask[]>('/tasks/'),
  create: (payload: AutomationTaskCreate) => request<AutomationTask>('/tasks', { method: 'POST', json: payload }),
  update: (id: number, payload: AutomationTaskUpdate) => request<AutomationTask>(`/tasks/${id}`, { method: 'PUT', json: payload }),
  remove: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};