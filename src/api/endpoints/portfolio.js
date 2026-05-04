import { tradingApi as api } from '../client'; 

export const portfolioApi = {
  // GET http://rafsi.davidovic.io:8082/api/client/{clientId}/assets
  // Returns all currently held asset positions for a client
  getClientPortfolio: (clientId) => api.get(`/client/${clientId}/assets`),

  // GET http://rafsi.davidovic.io:8082/api/actuary/{actId}/assets
  // Returns all currently held asset positions for an actuary
  getActuaryPortfolio: (actId) => api.get(`/actuary/${actId}/assets`),
};