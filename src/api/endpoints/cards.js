import api from '../client';

export const cardsApi = {
  getById: (id) => api.get(`/cards/${id}`),
  getByUser: (userId) => api.get(`/cards/user/${userId}`),
  updateLimits: (id, payload) => api.patch(`/cards/${id}/limits`, payload),
  block: (id) => api.patch(`/cards/${id}/block`),
  unblock: (id) => api.patch(`/cards/${id}/unblock`),
  deactivate: (id) => api.patch(`/cards/${id}/deactivate`),
  requestNew: (userId, data) => api.post(`/cards/user/${userId}/request`, data),
  getAll:   (params)     => api.get('/cards', { params }),
};
