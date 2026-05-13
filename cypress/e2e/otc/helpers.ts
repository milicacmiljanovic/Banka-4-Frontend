export type TestUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  identity_type: 'employee' | 'client';
  is_admin?: boolean;
  permissions: string[];
};

export const clientWithTrading: TestUser = {
  id: 2001,
  first_name: 'Klijent',
  last_name: 'Trader',
  email: 'trader@example.com',
  identity_type: 'client',
  permissions: ['trading'],
};

export const clientNoTrading: TestUser = {
  id: 2002,
  first_name: 'Klijent',
  last_name: 'NoTrade',
  email: 'notrade@example.com',
  identity_type: 'client',
  permissions: [],
};

export const supervisorUser: TestUser = {
  id: 9001,
  first_name: 'Sanja',
  last_name: 'Supervizor',
  email: 'supervisor@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['supervisor'],
};

export const agentUser: TestUser = {
  id: 9002,
  first_name: 'Aca',
  last_name: 'Agent',
  email: 'agent@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['orders.create', 'trading'],
};

export function loginAs(user: TestUser, targetPath: string): void {
  cy.visit(targetPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('refreshToken', 'test-refresh-token');
      win.localStorage.setItem('user', JSON.stringify(user));
    },
  });
}

export function buildPublicListing(overrides: Record<string, unknown> = {}) {
  return {
    asset_ownership_id: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    owner_name: 'Marko Marković',
    available_amount: 100,
    price: 180.50,
    ...overrides,
  };
}

export function buildOffer(overrides: Record<string, unknown> = {}) {
  return {
    otc_offer_id: 101,
    ticker: 'AAPL',
    amount: 50,
    price_per_stock_rsd: 18100.00,
    settlement_date: '2099-12-31T00:00:00Z',
    premium: 10.00,
    buyer_id: 2001,
    seller_id: 9002,
    status: 'PENDING',
    ...overrides,
  };
}

export function buildContract(overrides: Record<string, unknown> = {}) {
  return {
    otc_option_contract_id: 201,
    ticker: 'MSFT',
    amount: 25,
    strike_price_rsd: 1500.00,
    premium_rsd: 50.00,
    settlement_date: '2099-12-31T00:00:00Z',
    seller_id: 9002,
    profit: 125.00,
    status: 'ACTIVE',
    ...overrides,
  };
}
