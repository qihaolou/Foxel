import request from './client';

export interface LogItem {
  id: number;
  timestamp: string;
  level: string;
  source: string;
  message: string;
  details: Record<string, any>;
  user_id?: number;
}

export interface PaginatedLogs {
  items: LogItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface GetLogsParams {
  page?: number;
  page_size?: number;
  level?: string;
  source?: string;
  start_time?: string;
  end_time?: string;
}

export interface ClearLogsParams {
  start_time?: string;
  end_time?: string;
}

export const logsApi = {
  list: (params: GetLogsParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.level) query.append('level', params.level);
    if (params.source) query.append('source', params.source);
    if (params.start_time) query.append('start_time', params.start_time);
    if (params.end_time) query.append('end_time', params.end_time);
    return request<PaginatedLogs>(`/logs?${query.toString()}`);
  },
  clear: (params: ClearLogsParams = {}) => {
    const query = new URLSearchParams();
    if (params.start_time) query.append('start_time', params.start_time);
    if (params.end_time) query.append('end_time', params.end_time);
    return request<{ deleted_count: number }>(`/logs?${query.toString()}`, {
      method: 'DELETE',
    });
  },
};