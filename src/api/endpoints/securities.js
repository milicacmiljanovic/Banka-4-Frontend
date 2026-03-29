import { bankingApi as api } from '../client';

// ─── PLACEHOLDER — swap mock imports with real calls when backend is ready ───

export const securitiesApi = {
  // List all securities, optionally filtered/sorted
  // params: { type, exchange, search, priceMin, priceMax, bidMin, bidMax,
  //           askMin, askMax, volumeMin, volumeMax, settlementDate,
  //           sortBy, sortDir, page, size }
  getAll: (params) => api.get('/securities', { params }),

  // Get single security details (includes options for STOCKs)
  getById: (id) => api.get(`/securities/${id}`),

  // Refresh a single security's market data
  refresh: (id) => api.post(`/securities/${id}/refresh`),

  // Refresh all securities in current view
  refreshAll: () => api.post('/securities/refresh'),

  // Client: instant buy
  buy: (data) =>
    api.post('/securities/orders', { ...data, orderType: 'BUY', instant: true }),

  // Employee/Actuary: create buy order (goes to approval)
  createOrder: (data) =>
    api.post('/securities/orders', { ...data, orderType: 'BUY', instant: false }),

  // Exercise an option (only if ITM and before settlement)
  exerciseOption: (optionId) => api.post(`/securities/options/${optionId}/exercise`),
};
