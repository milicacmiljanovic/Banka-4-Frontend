import { buildStocks, loginAs, agentUser } from './helpers';

const EXP = '2026-06-20';

// Backend flat format — getStockById poziva mapOptionRaw + groupOptions interno
const backendStock = {
  ...buildStocks()[0],
  history: [],
  options: [
    { listing_id: 101, option_type: 'CALL', settlement_date: EXP, strike: 400, price: 15.2, bid: 15.0, ask: 15.4, volume: 1200, open_interest: 8000, implied_volatility: 0.25 },
    { listing_id: 102, option_type: 'PUT',  settlement_date: EXP, strike: 400, price: 0.8,  bid: 0.75, ask: 0.85, volume: 300,  open_interest: 1500, implied_volatility: 0.10 },
    { listing_id: 103, option_type: 'CALL', settlement_date: EXP, strike: 420, price: 4.0,  bid: 3.8,  ask: 4.2,  volume: 600,  open_interest: 3000, implied_volatility: 0.22 },
    { listing_id: 104, option_type: 'PUT',  settlement_date: EXP, strike: 420, price: 7.8,  bid: 7.6,  ask: 8.0,  volume: 900,  open_interest: 5000, implied_volatility: 0.28 },
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
      body: backendStock,
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

  it('prikazuje kolone strike, bid, ask, vol, OI unutar tabele opcija', () => {
    cy.contains('h3', 'Opcije').closest('section').within(() => {
      cy.contains('STRIKE').should('exist');
      cy.contains('Bid').should('exist');
      cy.contains('Ask').should('exist');
      cy.contains('Vol').should('exist');
      cy.contains('OI').should('exist');
    });
  });

  it('prikazuje datum isteka u toolbar-u opcija', () => {
    cy.contains('h3', 'Opcije').closest('section').within(() => {
      cy.contains('2026').should('exist');
    });
  });

  it('prikazuje Shared Price banner', () => {
    cy.contains('Tržišna cena akcije (Shared Price)').should('be.visible');
  });
});
