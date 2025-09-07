import client from './client';

export const vectorDBApi = {
  clearAll: () => client('/vector-db/clear-all', { method: 'POST' }),
};