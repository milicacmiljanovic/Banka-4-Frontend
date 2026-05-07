import { tradingApi } from '../client';

export const investmentFundsApi = {
  createFund: (payload) =>
    tradingApi.post('/investment-funds', payload),

  getFunds: (params = {}) =>
    tradingApi.get('/funds', { params }),

  getFundDetails: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}`),

  getFundAssets: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}/assets`),

  getFundPerformance: (fundId, range = 'monthly') =>
    tradingApi.get(`/investment-funds/${fundId}/performance`, { params: { range } }),

  getFundPositions: () =>
    tradingApi.get('/profit/funds'),

  getManagedFunds: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/funds`),

  getClientFunds: (clientId) =>
    tradingApi.get('/me/funds', { params: clientId ? { client_id: clientId } : undefined }),

  getActuaryFunds: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/funds`),

  depositToFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/deposit`, payload),

  withdrawFromFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/withdraw`, payload),

  investInFund: (fundId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/invest`, payload),

  sellFundAsset: (fundId, assetId, payload) =>
    tradingApi.post(`/investment-funds/${fundId}/assets/${assetId}/sell`, payload),

  getActuaryPerformances: () =>
    tradingApi.get('/profit/actuaries'),

  getActuaryProfit: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/profit`),

  getClientProfit: (clientId) =>
    tradingApi.get(`/client/${clientId}/assets/profit`),

  getProfitActuaries: () =>
    tradingApi.get('/profit/actuaries'),

  getProfitFunds: () =>
    tradingApi.get('/profit/funds'),

  getAllFunds: (params = {}) => tradingApi.get('/funds', { params }),
  getFundDetails: (fundId) => tradingApi.get(`/investment-funds/${fundId}`),
  investInFund: (fundId, payload) => tradingApi.post(`/investment-funds/${fundId}/invest`, payload),
  getFundsManagedByActuary: (actId) => tradingApi.get(`/actuary/${actId}/assets/funds`),

};