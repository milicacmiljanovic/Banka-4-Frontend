import { tradingApi as api } from '../client';

export const portfolioApi = {
  // GET /client/{clientId}/assets
  getClientPortfolio: (clientId) => api.get(`/client/${clientId}/assets`),

  // GET /actuary/{actId}/assets
  getActuaryPortfolio: (actId) => api.get(`/actuary/${actId}/assets`),

  // POST /actuary/{actId}/options/{assetId}/exercise
  exerciseActuaryOption: (actId, assetId, accountNumber) =>
    api.post(`/actuary/${actId}/options/${assetId}/exercise`, {
      account_number: accountNumber,
    }),

  // Backwards-compat alias korišćen u OtcPortalPage — interno poziva actuary endpoint
  exerciseOption: (actId, assetId, accountNumber) =>
    api.post(`/actuary/${actId}/options/${assetId}/exercise`, {
      account_number: accountNumber,
    }),
};
