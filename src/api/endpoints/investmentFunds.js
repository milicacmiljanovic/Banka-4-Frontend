import { tradingApi } from '../client';

export const investmentFundsApi = {
  createFund: (payload) =>
    tradingApi.post('/investment-funds', payload),

  getFunds: (params = {}) =>
    tradingApi.get('/investment-funds', { params }),

  getFundDetails: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}`),

  getFundAssets: (fundId) =>
    tradingApi.get(`/investment-funds/${fundId}/assets`),

  getFundPerformance: (fundId, range = 'monthly') =>
    tradingApi.get(`/investment-funds/${fundId}/performance`, { params: { range } }),

  getManagedFunds: () =>
    tradingApi.get('/me/funds'),

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
    tradingApi.get('/profit-bank/actuaries'),

  getActuaryProfit: (actuaryId) =>
    tradingApi.get(`/actuary/${actuaryId}/assets/profit`),

  getClientProfit: (clientId) =>
    tradingApi.get(`/client/${clientId}/assets/profit`),
};