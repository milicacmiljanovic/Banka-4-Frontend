import { create } from 'zustand';
import { watchlistApi } from '../api/endpoints/watchlist';

export const useWatchlistStore = create((set, get) => ({
  watchlists: [],
  userId: null,

  init(userId) {
    if (get().userId === userId) return;
    set({ userId });
    get().loadWatchlists();
  },

  async loadWatchlists() {
    try {
      const response = await watchlistApi.getWatchlists();
      const lists = Array.isArray(response) ? response : response?.data ?? [];

      const watchlists = await Promise.all(
        lists.map(async (list) => {
          if (!list?.id) return list;
          try {
            const details = await watchlistApi.getWatchlistById(list.id);
            return details?.data ?? details;
          } catch {
            return list;
          }
        })
      );

      set({ watchlists });
    } catch {
      set({ watchlists: [] });
    }
  },

  async createWatchlist(name) {
    const response = await watchlistApi.createWatchlist(name);
    const result = response?.data ?? response;
    await get().loadWatchlists();
    return result?.id ?? null;
  },

  async deleteWatchlist(id) {
    await watchlistApi.deleteWatchlist(id);
    await get().loadWatchlists();
  },

  async addSecurity(watchlistId, sec) {
    await watchlistApi.addSecurity(watchlistId, sec.id);
    await get().loadWatchlists();
  },

  async removeSecurity(watchlistId, secId) {
    await watchlistApi.removeSecurity(watchlistId, secId);
    await get().loadWatchlists();
  },

  isWatched(secId) {
    return get().watchlists.some(w => w.securities?.some(s => s.id === secId));
  },
}));
