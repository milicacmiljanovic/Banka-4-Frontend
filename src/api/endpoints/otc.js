import { tradingApi as api } from '../client';

export const otcApi = {
  getPublicListings:   (params = {})          => api.get('/otc/public', { params }),
  createOffer:         (payload)               => api.post('/otc/offers', payload),
  getContracts:        ()                      => api.get('/otc/contracts'),
  getMyNegotiations:   ()                      => api.get('/otc/offers/active'),
  acceptOffer:         (offerId, data)         => api.patch(`/otc/offers/${offerId}/accept`, data ?? {}),
  rejectOffer:         (offerId, comment)      => api.patch(`/otc/offers/${offerId}/reject`, comment ? { comment } : {}),
  sendCounterOffer:    (offerId, data)         => api.put(`/otc/offers/${offerId}/counter`, data),
  publishActuaryAsset: (actId, ownershipId, amount) =>
    api.patch(`/actuary/${actId}/assets/${ownershipId}/publish`, { amount }),
  publishClientAsset:  (clientId, ownershipId, amount) =>
    api.patch(`/client/${clientId}/assets/${ownershipId}/publish`, { amount }),
};
