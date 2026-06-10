import { tradingApi as api } from '../client';

export const dividendsApi = {
  getPortfolioDividends: (assetOwnershipId) =>
    api.get(`/portfolio/assets/${assetOwnershipId}/dividends`),

  getClientDividends: (clientId, assetOwnershipId) =>
    api.get(`/client/${clientId}/assets/${assetOwnershipId}/dividends`),

  getActuaryDividends: (actId, assetOwnershipId) =>
    api.get(`/actuary/${actId}/assets/${assetOwnershipId}/dividends`),

  getAllDividends: () =>
    api.get('/dividends'),

  triggerDividends: () =>
    api.post('/dividends/trigger'),
};