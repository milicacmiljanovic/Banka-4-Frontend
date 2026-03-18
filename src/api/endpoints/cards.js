import api from '../client';

export const cardsApi = {
  getById: (id) => api.get(`/cards/${id}`),
  updateLimits: (id, payload) => api.patch(`/cards/${id}/limits`, payload),
  block: (id) => api.patch(`/cards/${id}/block`),
  unblock: (id) => api.patch(`/cards/${id}/unblock`),
  deactivate: (id) => api.patch(`/cards/${id}/deactivate`),
  getAll:   (params)     => api.get('/cards', { params }),
};
