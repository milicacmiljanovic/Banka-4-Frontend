
import api from '../client';

export const loansApi = {
  getAll:        ()       => api.get('/loans'),
  getRequests:   (params) => api.get('/loan-requests', { params }),
  approve:       (id)     => api.post(`/loan-requests/${id}/approve`),
  reject:        (id)     => api.post(`/loan-requests/${id}/reject`),
  updateRate:    (data)   => api.post('/loans/update-rate', data),
  createRequest: (data)   => api.post('/loan-requests', data),
};

