import api from '../client';

export const clientApi = {
  login:             (data)       => api.post('/client/login', data),
  getAccounts:       ()           => api.get('/client/accounts'),
  getTransactions:   (accountId)  => api.get('/client/transactions', { params: { account_id: accountId } }),
  getRecipients:     ()           => api.get('/client/recipients'),
  createRecipient:   (data)       => api.post('/client/recipients', data),
  updateRecipient:   (id, data)   => api.put(`/client/recipients/${id}`, data),
  deleteRecipient:   (id)         => api.delete(`/client/recipients/${id}`),
  getRates:          ()           => api.get('/client/rates'),
};