// ─── MOCK DATA ─── replace with real API calls later ───────────────────────

export const MOCK_STOCKS = [
  {
    id: 1, type: 'STOCK', ticker: 'AAPL', name: 'Apple Inc.',
    exchange: 'NASDAQ', price: 189.25, change: 1.34, changePercent: 0.71,
    volume: 54_320_100, bid: 189.20, ask: 189.30,
    maintenanceMargin: 0.25, initialMarginCost: 189.25 * 0.25 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 185 + Math.random() * 8 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 183 + Math.random() * 10 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 180 + Math.random() * 15 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 150 + Math.random() * 60 })),
    },
    options: [
      {
        settlementDate: '2025-06-20',
        strikes: [
          { strike: 175, call: { last: 15.2, theta: -0.05, bid: 15.0, ask: 15.4, volume: 1200, oi: 8500 }, put: { last: 1.1, theta: -0.02, bid: 1.0, ask: 1.2, volume: 800, oi: 4200 } },
          { strike: 180, call: { last: 10.8, theta: -0.06, bid: 10.6, ask: 11.0, volume: 2100, oi: 12000 }, put: { last: 2.4, theta: -0.03, bid: 2.2, ask: 2.6, volume: 1500, oi: 7800 } },
          { strike: 185, call: { last: 6.9,  theta: -0.07, bid: 6.7,  ask: 7.1,  volume: 3400, oi: 18000 }, put: { last: 4.5, theta: -0.05, bid: 4.3, ask: 4.7, volume: 2800, oi: 11000 } },
          { strike: 190, call: { last: 3.8,  theta: -0.08, bid: 3.6,  ask: 4.0,  volume: 5600, oi: 24000 }, put: { last: 8.1, theta: -0.07, bid: 7.9, ask: 8.3, volume: 4200, oi: 16000 } },
          { strike: 195, call: { last: 1.7,  theta: -0.06, bid: 1.5,  ask: 1.9,  volume: 4100, oi: 19000 }, put: { last: 13.2,theta: -0.08, bid: 13.0,ask: 13.4,volume: 3100, oi: 13000 } },
          { strike: 200, call: { last: 0.6,  theta: -0.04, bid: 0.5,  ask: 0.7,  volume: 2200, oi: 9500  }, put: { last: 18.5,theta: -0.05, bid: 18.3,ask: 18.7,volume: 1800, oi: 8200  } },
        ],
      },
      {
        settlementDate: '2025-09-19',
        strikes: [
          { strike: 170, call: { last: 22.1, theta: -0.03, bid: 21.9, ask: 22.3, volume: 900,  oi: 6000 }, put: { last: 2.8, theta: -0.01, bid: 2.6, ask: 3.0, volume: 600, oi: 3000 } },
          { strike: 180, call: { last: 14.5, theta: -0.04, bid: 14.3, ask: 14.7, volume: 1800, oi: 11000}, put: { last: 5.2, theta: -0.02, bid: 5.0, ask: 5.4, volume: 1200, oi: 6500 } },
          { strike: 190, call: { last: 8.2,  theta: -0.05, bid: 8.0,  ask: 8.4,  volume: 2900, oi: 17000}, put: { last: 10.1,theta: -0.04, bid: 9.9, ask: 10.3,volume: 2200, oi: 12000} },
          { strike: 200, call: { last: 3.9,  theta: -0.04, bid: 3.7,  ask: 4.1,  volume: 2100, oi: 14000}, put: { last: 16.8,theta: -0.05, bid: 16.6,ask: 17.0,volume: 1700, oi: 9500 } },
        ],
      },
    ],
  },
  {
    id: 2, type: 'STOCK', ticker: 'MSFT', name: 'Microsoft Corp.',
    exchange: 'NASDAQ', price: 421.10, change: -2.85, changePercent: -0.67,
    volume: 22_100_000, bid: 421.05, ask: 421.15,
    maintenanceMargin: 0.25, initialMarginCost: 421.10 * 0.25 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 418 + Math.random() * 8 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 415 + Math.random() * 12 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 400 + Math.random() * 30 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 320 + Math.random() * 120 })),
    },
    options: [
      {
        settlementDate: '2025-06-20',
        strikes: [
          { strike: 400, call: { last: 24.0, theta: -0.06, bid: 23.8, ask: 24.2, volume: 1100, oi: 7200 }, put: { last: 2.9, theta: -0.02, bid: 2.7, ask: 3.1, volume: 700, oi: 3800 } },
          { strike: 410, call: { last: 15.5, theta: -0.07, bid: 15.3, ask: 15.7, volume: 2300, oi: 13500}, put: { last: 5.1, theta: -0.03, bid: 4.9, ask: 5.3, volume: 1600, oi: 8200 } },
          { strike: 420, call: { last: 8.3,  theta: -0.08, bid: 8.1,  ask: 8.5,  volume: 3800, oi: 21000}, put: { last: 9.8, theta: -0.06, bid: 9.6, ask: 10.0,volume: 3100, oi: 15000} },
          { strike: 430, call: { last: 3.5,  theta: -0.07, bid: 3.3,  ask: 3.7,  volume: 2900, oi: 17000}, put: { last: 16.2,theta: -0.07, bid: 16.0,ask: 16.4,volume: 2400, oi: 11500} },
        ],
      },
    ],
  },
  {
    id: 3, type: 'STOCK', ticker: 'NVDA', name: 'NVIDIA Corp.',
    exchange: 'NASDAQ', price: 875.40, change: 22.15, changePercent: 2.60,
    volume: 41_880_000, bid: 875.30, ask: 875.50,
    maintenanceMargin: 0.30, initialMarginCost: 875.40 * 0.30 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 855 + Math.random() * 30 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 840 + Math.random() * 50 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 780 + Math.random() * 120 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 400 + Math.random() * 600 })),
    },
    options: [],
  },
  {
    id: 4, type: 'STOCK', ticker: 'GOOGL', name: 'Alphabet Inc.',
    exchange: 'NASDAQ', price: 172.63, change: 0.91, changePercent: 0.53,
    volume: 18_450_000, bid: 172.60, ask: 172.66,
    maintenanceMargin: 0.25, initialMarginCost: 172.63 * 0.25 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 170 + Math.random() * 6 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 168 + Math.random() * 10 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 160 + Math.random() * 20 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 120 + Math.random() * 70 })),
    },
    options: [],
  },
];

export const MOCK_FUTURES = [
  {
    id: 10, type: 'FUTURES', ticker: 'ESM25', name: 'E-mini S&P 500 Jun 2025',
    exchange: 'CME', price: 5248.75, change: -12.50, changePercent: -0.24,
    volume: 1_234_000, bid: 5248.50, ask: 5249.00,
    maintenanceMargin: 12_100, initialMarginCost: 12_100 * 1.1,
    settlementDate: '2025-06-20',
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 5230 + Math.random() * 40 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 5200 + Math.random() * 70 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 5100 + Math.random() * 180 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 4500 + Math.random() * 800 })),
    },
  },
  {
    id: 11, type: 'FUTURES', ticker: 'CLQ25', name: 'Crude Oil Jul 2025',
    exchange: 'NYMEX', price: 78.42, change: 0.68, changePercent: 0.87,
    volume: 432_500, bid: 78.40, ask: 78.44,
    maintenanceMargin: 5_500, initialMarginCost: 5_500 * 1.1,
    settlementDate: '2025-07-22',
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 77 + Math.random() * 3 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 76 + Math.random() * 5 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 72 + Math.random() * 12 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 60 + Math.random() * 30 })),
    },
  },
  {
    id: 12, type: 'FUTURES', ticker: 'GCQ25', name: 'Gold Aug 2025',
    exchange: 'COMEX', price: 2348.80, change: 15.20, changePercent: 0.65,
    volume: 185_000, bid: 2348.50, ask: 2349.10,
    maintenanceMargin: 9_000, initialMarginCost: 9_000 * 1.1,
    settlementDate: '2025-08-28',
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 2330 + Math.random() * 30 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 2310 + Math.random() * 60 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 2200 + Math.random() * 200 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 1900 + Math.random() * 500 })),
    },
  },
];

export const MOCK_FOREX = [
  {
    id: 20, type: 'FOREX', ticker: 'EUR/USD', name: 'Euro / US Dollar',
    exchange: 'FX', price: 1.0845, change: 0.0012, changePercent: 0.11,
    volume: 5_200_000_000, bid: 1.0844, ask: 1.0846,
    maintenanceMargin: 0.02, initialMarginCost: 0.02 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 1.082 + Math.random() * 0.005 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 1.080 + Math.random() * 0.008 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 1.075 + Math.random() * 0.015 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 1.060 + Math.random() * 0.040 })),
    },
  },
  {
    id: 21, type: 'FOREX', ticker: 'GBP/USD', name: 'British Pound / US Dollar',
    exchange: 'FX', price: 1.2710, change: -0.0008, changePercent: -0.06,
    volume: 2_800_000_000, bid: 1.2709, ask: 1.2711,
    maintenanceMargin: 0.02, initialMarginCost: 0.02 * 1.1,
    currency: 'USD',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 1.268 + Math.random() * 0.006 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 1.265 + Math.random() * 0.010 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 1.258 + Math.random() * 0.020 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 1.220 + Math.random() * 0.060 })),
    },
  },
  {
    id: 22, type: 'FOREX', ticker: 'USD/JPY', name: 'US Dollar / Japanese Yen',
    exchange: 'FX', price: 154.32, change: 0.45, changePercent: 0.29,
    volume: 4_100_000_000, bid: 154.31, ask: 154.33,
    maintenanceMargin: 0.02, initialMarginCost: 0.02 * 1.1,
    currency: 'JPY',
    priceHistory: {
      '1D': Array.from({ length: 24 }, (_, i) => ({ t: i, v: 153.5 + Math.random() * 1.5 })),
      '1W': Array.from({ length: 7  }, (_, i) => ({ t: i, v: 152.0 + Math.random() * 3 })),
      '1M': Array.from({ length: 30 }, (_, i) => ({ t: i, v: 148 + Math.random() * 9 })),
      '1Y': Array.from({ length: 12 }, (_, i) => ({ t: i, v: 130 + Math.random() * 30 })),
    },
  },
];

export const ALL_MOCK_SECURITIES = [...MOCK_STOCKS, ...MOCK_FUTURES, ...MOCK_FOREX];
