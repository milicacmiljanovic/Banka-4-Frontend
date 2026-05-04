export type StockListing = {
  listing_id: number;
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  bid: number;
  ask: number;
  maintenance_margin: number;
  initial_margin_cost: number;
  currency: string;
};

export type FuturesListing = {
  listing_id: number;
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  volume: number;
  bid: number;
  ask: number;
  maintenance_margin: number;
  initial_margin_cost: number;
  settlement_date: string;
  contract_size: number;
  contract_unit: string;
  currency: string;
};

export type AccountRow = {
  account_number: string;
  name: string;
  balance: number;
  currency: string;
};

export const primaryAccount: AccountRow = {
  account_number: '265-1111111111111-11',
  name: 'Glavni račun',
  balance: 500000,
  currency: 'USD',
};

export function buildStock(overrides: Partial<StockListing> = {}): StockListing {
  return {
    listing_id: 501,
    ticker: 'ALFA',
    name: 'Alfa Bank',
    exchange: 'NASDAQ',
    price: 125,
    change: 1.25,
    change_percent: 1,
    volume: 125000,
    bid: 124.8,
    ask: 125.2,
    maintenance_margin: 0.25,
    initial_margin_cost: 1000,
    currency: 'USD',
    ...overrides,
  };
}

export function buildFutures(overrides: Partial<FuturesListing> = {}): FuturesListing {
  return {
    listing_id: 701,
    ticker: 'CLZ26',
    name: 'Crude Oil Dec 2026',
    exchange: 'NYMEX',
    price: 80,
    change: -0.5,
    volume: 25000,
    bid: 79.9,
    ask: 80.1,
    maintenance_margin: 1200,
    initial_margin_cost: 1500,
    settlement_date: '2025-01-01T00:00:00Z',
    contract_size: 100,
    contract_unit: 'bbl',
    currency: 'USD',
    ...overrides,
  };
}

export function prepareClientSecuritiesPage(endpoint: 'stocks' | 'futures', listings: Array<StockListing | FuturesListing>, accounts: AccountRow[] = [primaryAccount]) {
  cy.loginAsClient();

  cy.intercept('GET', `**/listings/${endpoint}*`, {
    statusCode: 200,
    body: { data: listings },
  }).as('getListings');

  cy.intercept('GET', '**/clients/*/accounts*', {
    statusCode: 200,
    body: { data: accounts },
  }).as('getAccounts');

  cy.intercept('GET', '**/clients/*/loans*', {
    statusCode: 200,
    body: { data: [] },
  }).as('getLoans');

  cy.visit('/client/securities');
  cy.wait('@getListings');
}

export function openOrderModal(ticker: string) {
  cy.contains('tbody tr', ticker).within(() => {
    cy.contains('button', 'Kupi').click();
  });
  cy.contains('h3', new RegExp(`Kupi\\s*—\\s*${ticker}`)).should('be.visible');
}

export function fillCommonOrderFields(options: {
  accountNumber?: string;
  quantity: string | number;
  orderType?: 'Market' | 'Limit' | 'Stop' | 'Stop Limit';
  limitValue?: string | number;
  stopValue?: string | number;
}) {
  const { accountNumber = primaryAccount.account_number, quantity, orderType, limitValue, stopValue } = options;

  if (orderType) {
    cy.contains('label', 'Tip ordera').parent().find('select').select(orderType);
  }

  cy.contains('label', 'Račun za kupovinu').parent().find('select').select(accountNumber);
  cy.contains('label', 'Količina').parent().find('input[type="number"]').clear().type(String(quantity));

  if (limitValue !== undefined) {
    cy.contains('label', /limit cena/i).parent().find('input[type="number"]').clear().type(String(limitValue));
  }

  if (stopValue !== undefined) {
    cy.contains('label', /stop cena/i).parent().find('input[type="number"]').clear().type(String(stopValue));
  }
}

export function submitOrderAndConfirm() {
  cy.contains('button', 'Nastavi').scrollIntoView().click({ force: true });
  cy.contains('h4', 'Potvrda ordera').should('be.visible');
export type TestUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  identity_type: 'employee' | 'client';
  is_admin?: boolean;
  permissions: string[];
};

// Aktuar (agent) — zaposleni koji može da trguje
export const agentUser: TestUser = {
  id: 9002,
  first_name: 'Aca',
  last_name: 'Agent',
  email: 'agent@raf.rs',
  identity_type: 'employee',
  is_admin: false,
  permissions: ['orders.create'],
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

export function tradingApiUrl(): string {
  return (Cypress.env('TRADING_API_URL') as string) ?? 'http://localhost:8082/api';
}

export function loginAs(user: TestUser, targetPath: string): void {
  cy.visit(targetPath, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', 'test-token');
      win.localStorage.setItem('refreshToken', 'test-refresh-token');
      win.localStorage.setItem('user', JSON.stringify(user));
    },
  });
}

// Backend format za akcije (pre mapStock transformacije)
export function buildStocks() {
  return [
    {
      listing_id: 1,
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      exchange: 'NASDAQ',
      price: 415.2,
      change: 3.5,
      change_percent: 0.85,
      volume: 22000000,
      bid: 415.0,
      ask: 415.4,
      maintenance_margin: 0,
      currency: 'USD',
    },
    {
      listing_id: 2,
      ticker: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      price: 188.5,
      change: -1.2,
      change_percent: -0.63,
      volume: 55000000,
      bid: 188.3,
      ask: 188.7,
      maintenance_margin: 0,
      currency: 'USD',
    },
    {
      listing_id: 3,
      ticker: 'JPM',
      name: 'JPMorgan Chase',
      exchange: 'NYSE',
      price: 195.0,
      change: 0.8,
      change_percent: 0.41,
      volume: 9000000,
      bid: 194.9,
      ask: 195.1,
      maintenance_margin: 0,
      currency: 'USD',
    },
  ];
}

export function buildFutures() {
  return [
    {
      listing_id: 10,
      ticker: 'ES',
      name: 'E-mini S&P 500',
      exchange: 'CME',
      price: 5200.0,
      change: -10.5,
      volume: 800000,
      bid: 5199.5,
      ask: 5200.5,
      maintenance_margin: 0,
      settlement_date: '2025-06-20',
      contract_size: 50,
      contract_unit: 'USD',
      currency: 'USD',
    },
  ];
}

export function buildForex() {
  return [
    {
      listing_id: 20,
      ticker: 'EUR/USD',
      name: 'Euro / US Dollar',
      exchange: 'FOREX',
      price: 1.08,
      change: 0.002,
      volume: 1000000000,
      bid: 1.0798,
      ask: 1.0802,
      maintenance_margin: 0,
      base: 'EUR',
      quote: 'USD',
      contract_size: 100000,
    },
  ];
}
