import { create } from 'zustand';

export const useAccountStore = create((set, get) => ({
  accounts:            [],
  selectedAccountId:   null,
  transactions:        [],
  transactionsLoading: false,
  sortBy:              'date',
  sortOrder:           'desc',

  setAccounts: (accounts) => {
    const sorted = [...accounts]
      .filter(a => a.status === 'ACTIVE')
      .sort((a, b) => b.available_balance - a.available_balance);
    set({ accounts: sorted, selectedAccountId: sorted[0]?.account_id ?? null });
  },

  selectAccount: (accountId) => set({
    selectedAccountId: accountId,
    transactions:      [],
    transactionsLoading: true,
  }),

  setTransactions: (transactions) => set({ transactions, transactionsLoading: false }),

  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

  getSortedTransactions: () => {
    const { transactions, sortBy, sortOrder } = get();
    return [...transactions].sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = new Date(a.date) - new Date(b.date);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const cmp = a.type.localeCompare(b.type);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  },

  reset: () => set({
    accounts: [], selectedAccountId: null, transactions: [],
    transactionsLoading: false, sortBy: 'date', sortOrder: 'desc',
  }),
}));
