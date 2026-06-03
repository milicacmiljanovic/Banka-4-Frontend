import api from '../client';

export const auditLogsApi = {
  getAll: (params = {}) => api.get('/audit-log', { params: { page: 1, page_size: 20, ...params } }),
};
