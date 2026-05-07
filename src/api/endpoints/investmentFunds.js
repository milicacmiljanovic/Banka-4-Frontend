import { tradingApi } from '../client';

export const investmentFundsApi = {
  createFund: (payload) =>
    tradingApi.post('/investment-funds', payload),

  getFunds: (params = {}) =>
    tradingApi.get('/funds', { params }),

  getAllFunds: (params = {}) =>
    tradingApi.get('/funds', { params }),

  getFundDetails: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}`),

  // POST /investment-funds/{fundId}/invest — klijent ili supervizor ulažu u fond
  investInFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/invest`, payload),

  // Alias za investInFund — koristi se u deposit modalima
  depositToFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/invest`, payload),

  withdrawFromFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/withdraw`, payload),

  // GET /client/{clientId}/funds — pozicije klijenta u fondovima
  getClientFunds: (clientId) =>
    tradingApi.get(`/client/${clientId}/funds`),

  // GET /actuary/{actId}/assets/funds — fondovi kojima upravlja aktuar
  getActuaryFunds: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/funds`),

  getManagedFunds: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/funds`),

  getFundsManagedByActuary: (actId) =>
    tradingApi.get(`/actuary/${actId}/assets/funds`),

  getFundPositions: () =>
    tradingApi.get('/profit/funds'),

  getActuaryPerformances: () =>
    tradingApi.get('/profit/actuaries'),

  getProfitActuaries: () =>
    tradingApi.get('/profit/actuaries'),

  getProfitFunds: () =>
    tradingApi.get('/profit/funds'),

  getActuaryProfit: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/profit`),

  getClientProfit: (clientId) =>
    tradingApi.get(`/client/${clientId}/assets/profit`),
};
