import { tradingApi as api } from '../client';

function unpack(res) {
  const raw = (res?.data !== undefined && res?.status !== undefined) ? res.data : res;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function normalizeAssetType(type) {
  switch (type) {
    case 'stock':
      return 'STOCK';
    case 'option':
      return 'OPTIONS';
    case 'future':
      return 'FUTURES';
    case 'forexPair':
      return 'FOREX';
    default:
      return type;
  }
}

function normalizeSecurity(item) {
  return {
    id: item.id ?? item.listing_id ?? item.security_id ?? item.listingId ?? item.securityId,
    ticker: item.ticker ?? item.symbol ?? item.code ?? null,
    type:
    item.type ?? item.security_type ?? normalizeAssetType(item.asset_type),
    name: item.name ?? item.security_name ?? null,
    price: item.price ?? item.current_price ?? item.value ?? null,
    change: item.change ?? item.delta ?? null,
    changePercent: item.changePercent ?? item.change_percent ?? item.delta_percent ?? item.change_pct ?? null,
    volume: item.volume ?? item.vol ?? item.turnover ?? null,
    currency: item.currency ?? item.base_currency ?? item.quote_currency ?? null,
    ...item,
  };
}

function normalizeWatchlist(raw) {
  const securities = Array.isArray(raw.listings)
    ? raw.listings.map(normalizeSecurity)
    : Array.isArray(raw.securities)
      ? raw.securities.map(normalizeSecurity)
      : Array.isArray(raw.items)
        ? raw.items.map(normalizeSecurity)
        : [];

  return {
    id: raw.id ?? raw.watchlist_id ?? raw.watchlistId,
    name: raw.name ?? raw.title ?? raw.watchlist_name ?? null,
    securities,
    ...raw,
  };
}

function normalizeWatchlistSummary(raw) {
  return {
    id: raw.id ?? raw.watchlist_id ?? raw.watchlistId,
    name: raw.name ?? raw.title ?? raw.watchlist_name ?? null,
  };
}

export const watchlistApi = {
  async getWatchlists() {
    const res = await api.get('/watchlists');
    const data = unpack(res);
    const items = Array.isArray(data) ? data : data?.data ?? [];
    return items.map(normalizeWatchlistSummary);
  },

  async getWatchlistById(id) {
    const res = await api.get(`/watchlists/${id}`);
    return normalizeWatchlist(unpack(res));
  },

  async createWatchlist(name) {
    const res = await api.post('/watchlists', { name });
    return normalizeWatchlistSummary(unpack(res));
  },

  deleteWatchlist(id) {
    return api.delete(`/watchlists/${id}`);
  },

  addSecurity(watchlistId, listingId) {
    return api.post(`/watchlists/${watchlistId}/items`, { listing_id: listingId });
  },

  removeSecurity(watchlistId, listingId) {
    return api.delete(`/watchlists/${watchlistId}/items/${listingId}`);
  },
};
