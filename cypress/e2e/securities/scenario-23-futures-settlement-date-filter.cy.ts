import { loginAs, agentUser } from './helpers';

const futures = [
  {
    listing_id: 10,
    ticker: 'ESM26',
    name: 'E-mini S&P 500 Jun 2026',
    exchange: 'CME',
    price: 5200.0,
    change: -10.5,
    change_percent: -0.2,
    volume: 800000,
    bid: 5199.5,
    ask: 5200.5,
    maintenance_margin: 12000,
    initial_margin_cost: 15000,
    settlement_date: '2026-06-20',
    contract_size: 50,
    contract_unit: 'USD',
    currency: 'USD',
  },
  {
    listing_id: 11,
    ticker: 'ESU26',
    name: 'E-mini S&P 500 Sep 2026',
    exchange: 'CME',
    price: 5210.0,
    change: -5.0,
    change_percent: -0.09,
    volume: 400000,
    bid: 5209.5,
    ask: 5210.5,
    maintenance_margin: 12000,
    initial_margin_cost: 15000,
    settlement_date: '2026-09-19',
    contract_size: 50,
    contract_unit: 'USD',
    currency: 'USD',
  },
  {
    listing_id: 12,
    ticker: 'CLZ26',
    name: 'Crude Oil Dec 2026',
    exchange: 'NYMEX',
    price: 80.0,
    change: -0.5,
    change_percent: -0.6,
    volume: 250000,
    bid: 79.9,
    ask: 80.1,
    maintenance_margin: 1200,
    initial_margin_cost: 1500,
    settlement_date: '2026-12-22',
    contract_size: 100,
    contract_unit: 'bbl',
    currency: 'USD',
  },
];

describe('Scenario 23: Filtriranje futures ugovora po Settlement Date', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [],
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: '/api/listings/futures' }, {
      statusCode: 200,
      body: futures,
    }).as('getFutures');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('button', 'Futures').click();
    cy.wait('@getFutures');
  });

  it('prikazuje sve futures ugovore pre filtriranja', () => {
    cy.contains('ESM26').should('be.visible');
    cy.contains('ESU26').should('be.visible');
    cy.contains('CLZ26').should('be.visible');
  });

  it('filtrira futures po opsegu settlement date (Jun—Sep 2026)', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="date"]').first().type('2026-06-01');
    cy.get('input[type="date"]').last().type('2026-09-30');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('ESM26').should('be.visible');
    cy.contains('ESU26').should('be.visible');
    cy.contains('CLZ26').should('not.exist');
  });

  it('prikazuje samo ugovore čiji datum je u zadatom opsegu', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="date"]').first().type('2026-12-01');
    cy.get('input[type="date"]').last().type('2026-12-31');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('CLZ26').should('be.visible');
    cy.contains('ESM26').should('not.exist');
    cy.contains('ESU26').should('not.exist');
  });
});