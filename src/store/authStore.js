import { create } from 'zustand';

export const useAuthStore = create(set => ({
  user:         null,
  token:        null,
  refreshToken: null,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, refreshToken });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, refreshToken: null });
  },

  initFromStorage: () => {
    const token        = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const raw          = localStorage.getItem('user');
    const user         = raw && raw !== 'undefined' ? JSON.parse(raw) : null;
    if (token) set({ token, refreshToken, user });
  },
}));
