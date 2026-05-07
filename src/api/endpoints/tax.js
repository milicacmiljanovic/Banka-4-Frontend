import { tradingApi as api } from '../client';

export const taxApi = {
  // GET /api/tax/users — lista korisnika sa poreskim podacima
  // Podržava query params: userType ("client"|"actuary"), first_name, last_name, page, page_size
  getUsers: (params = {}) => api.get('/tax', { params }),

  // POST /api/tax/collect — pokretanje naplate poreza za SVE korisnike (bez parametara)
  collect: () => api.post('/tax/collect'),

  // GET /api/actuary/{actId}/accumulated-tax — vraća { totalTax: number }
  getActuaryTax: (actId) => api.get(`/actuary/${actId}/accumulated-tax`),

  // GET /api/client/{clientId}/accumulated-tax — vraća { totalTax: number }
  getClientTax: (clientId) => api.get(`/client/${clientId}/accumulated-tax`),

};
export const otcApi = {
  getPublic: (params = {}) => api.get('/otc/public', { params }),
  createOffer: (payload) => api.post('/otc/offers', payload),
};