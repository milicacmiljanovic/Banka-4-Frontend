import coreApi, { bankingApi } from '../client';

export const accountsApi = {
  // Employee: list all accounts (paginated, filterable)
  getAll: (params) => bankingApi.get('/accounts', { params }),

  // Employee: search client by JMBG or email
  searchClient: (query) => {
    const isEmail = String(query).includes('@');
    const params = isEmail ? { email: query } : { jmbg: query };
    
    return coreApi.get('/clients', { params }).then(res => {
      const results = res.data ?? res;
      if (Array.isArray(results) && results.length > 0) return results[0];
      if (results && !Array.isArray(results) && Object.keys(results).length > 0) return results;
      
      const err = new Error('Klijent nije pronađen.');
      err.status = 404;
      throw err;
    });
  },

  // Employee: create new bank account
  create: (data) => bankingApi.post('/accounts', data),

  // Get full account details
  getOne: (clientId, accountNumber) =>
    bankingApi.get(`/clients/${clientId}/accounts/${accountNumber}`),

  // Update account name
  updateName: (clientId, accountNumber, name) =>
    bankingApi.put(`/clients/${clientId}/accounts/${accountNumber}/name`, { name }),

  // Request limit change (sends OTP to client)
  requestLimitChange: (clientId, accountNumber, data) =>
    bankingApi.post(`/clients/${clientId}/accounts/${accountNumber}/limits/request`, data),

  // Confirm limit change with OTP code
  confirmLimitChange: (clientId, accountNumber, code) =>
    bankingApi.put(`/clients/${clientId}/accounts/${accountNumber}/limits`, { code }),
};
