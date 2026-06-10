import { create } from 'zustand';
import { watchlistApi } from '../api/endpoints/watchlist';

export const useWatchlistStore = create((set, get) => ({
  watchlists: [],
  userId: null,
  toastOpen: false,
  toastMsg: '',

  closeToast() {
    set({ toastOpen: false });
  },

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
    try {
      const response = await watchlistApi.createWatchlist(name);
      const result = response?.data ?? response;
      const id = result?.id ?? null;
      if (id) {
        const details = await watchlistApi.getWatchlistById(id);
        set({ watchlists: [...get().watchlists, details] });
      }
      return id;
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const msg = status === 409
        ? 'Watchlista sa tim imenom već postoji.'
        : 'Greška pri kreiranju liste. Pokušajte ponovo.';
      set({ toastOpen: true, toastMsg: msg });
      return null;
    }
  },

  async deleteWatchlist(id) {
    try {
      await watchlistApi.deleteWatchlist(id);
      set({ watchlists: get().watchlists.filter(w => w.id !== id) });
    } catch {
      set({ toastOpen: true, toastMsg: 'Greška pri brisanju liste. Pokušajte ponovo.' });
    }
  },

  async addSecurity(watchlistId, sec) {
    try {
      await watchlistApi.addSecurity(watchlistId, sec.id);
      const updated = await watchlistApi.getWatchlistById(watchlistId);
      set({ watchlists: get().watchlists.map(w => w.id === watchlistId ? updated : w) });
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      const msg = status === 409
        ? 'Ova hartija je već u watchlisti.'
        : 'Greška pri dodavanju hartije u listu. Pokušajte ponovo.';
      set({ toastOpen: true, toastMsg: msg });
    }
  },

  async removeSecurity(watchlistId, secId) {
    try {
      await watchlistApi.removeSecurity(watchlistId, secId);
      const updated = await watchlistApi.getWatchlistById(watchlistId);
      set({ watchlists: get().watchlists.map(w => w.id === watchlistId ? updated : w) });
    } catch {
      set({ toastOpen: true, toastMsg: 'Greška pri uklanjanju hartije iz liste. Pokušajte ponovo.' });
    }
  },

  isWatched(secId) {
    return get().watchlists.some(w => w.securities?.some(s => s.id === secId));
  },
}));
