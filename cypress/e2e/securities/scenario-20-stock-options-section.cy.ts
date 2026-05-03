import { buildStocks, loginAs, agentUser } from './helpers';

// Opcijska sekcija u OptionTable.jsx očekuje format:
// options: [{ settlementDate: string, strikes: [{ strike, call: {...}, put: {...} }] }]
const stockWithOptions = {
  ...buildStocks()[0],
  priceHistory: { '1D': [], '1W': [], '1M': [], '1Y': [], '5Y': [] },
  options: [
    {
      settlementDate: '2026-06-20',
      strikes: [
        {
          strike: 400,
          call: { last: 15.2, theta: -0.05, bid: 15.0, ask: 15.4, volume: 1200, oi: 8000 },
          put:  { last: 0.8,  theta: -0.01, bid: 0.75, ask: 0.85, volume: 300,  oi: 1500 },
        },
        {
          strike: 410,
          call: { last: 10.5, theta: -0.06, bid: 10.3, ask: 10.7, volume: 950, oi: 6000 },
          put:  { last: 2.1,  theta: -0.02, bid: 2.0,  ask: 2.2,  volume: 500, oi: 3000 },
        },
        {
          strike: 415,
          call: { last: 7.0,  theta: -0.07, bid: 6.8,  ask: 7.2,  volume: 800, oi: 4000 },
          put:  { last: 4.5,  theta: -0.03, bid: 4.3,  ask: 4.7,  volume: 700, oi: 3500 },
        },
        {
          strike: 420,
          call: { last: 4.0,  theta: -0.08, bid: 3.8,  ask: 4.2,  volume: 600, oi: 3000 },
          put:  { last: 7.8,  theta: -0.04, bid: 7.6,  ask: 8.0,  volume: 900, oi: 5000 },
        },
        {
          strike: 430,
          call: { last: 1.5,  theta: -0.09, bid: 1.4,  ask: 1.6,  volume: 200, oi: 1000 },
          put:  { last: 14.0, theta: -0.05, bid: 13.8, ask: 14.2, volume: 1100, oi: 7000 },
        },
      ],
    },
  ],
};

describe('Scenario 20: Detaljan prikaz akcije sadrži sekciju sa opcijama', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [buildStocks()[0]],
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${buildStocks()[0].listing_id}` }, {
      statusCode: 200,
      body: stockWithOptions,
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');
  });

  it('prikazuje sekciju Opcije', () => {
    cy.contains('h3', 'Opcije').should('be.visible');
  });

  it('opcijska tabela sadrži CALLS i PUTS zaglavlja', () => {
    cy.contains('CALLS').should('be.visible');
    cy.contains('PUTS').should('be.visible');
  });

  it('prikazuje kolone: strike, bid, ask, volumen, OI i datum isteka', () => {
    cy.contains('STRIKE').should('be.visible');
    cy.contains('Bid').should('be.visible');
    cy.contains('Ask').should('be.visible');
    cy.contains('Vol').should('be.visible');
    cy.contains('OI').should('be.visible');
    cy.contains('2026').should('be.visible');
  });

  it('prikazuje Shared Price banner', () => {
    cy.contains('Shared Price').should('be.visible');
  });
});