import { bankingApi as api } from '../client';

export const transfersApi = {
  // Get transfer history for a client (paginated)
  getHistory: (clientId, params) => api.get(`/clients/${clientId}/transfers`, { params }),

  // Send OTP for transfer
  sendOtp: (clientId, data) => api.post(`/clients/${clientId}/transfers/send-otp`, data),

  // Execute internal transfer: { from_account, to_account, amount }
  execute: (clientId, data) => api.post(`/clients/${clientId}/transfers`, data),
};
