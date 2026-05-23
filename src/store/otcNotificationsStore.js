import { create } from 'zustand';

export const useOtcNotifStore = create((set, get) => ({
  // koliko novih/promena ima od poslednjeg "viđeno"
  count: 0,

  // poslednja toast poruka (globalno)
  toastOpen: false,
  toastMsg: '',

  bump(n = 1, msg = 'Imate nove OTC promene.') {
    set(state => ({
      count: state.count + (Number(n) || 0),
      toastOpen: true,
      toastMsg: msg,
    }));
  },

  closeToast() {
    set({ toastOpen: false });
  },

  clear() {
    set({ count: 0 });
  },
}));