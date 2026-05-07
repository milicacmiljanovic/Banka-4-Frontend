import { buildStocks, buildFuturesList as buildFutures, buildForex, loginAs, agentUser } from './helpers';

describe('Scenario 11: Aktuar vidi sve podržane tipove hartija', () => {
  beforeEach(() => {
  
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/api/listings/futures*', {
      statusCode: 200,
      body: [buildFutures()],
    }).as('getFutures');
    
    cy.intercept('GET', '**/api/listings/forex*', {
      statusCode: 200,
      body: buildForex(),
    }).as('getForex');

    cy.intercept({ method: 'GET', pathname: '/api/listings/options' }, {
      statusCode: 200,
      body: [],
    }).as('getOptions');

    loginAs(agentUser, '/securities');
  });

  it('vidi akcije, futures i forex tabove i može da ih menja', () => {
    cy.wait('@getStocks');

    // Sva četiri taba su vidljiva (aktuar = zaposleni)
    cy.contains('button', 'Akcije').should('be.visible');
    cy.contains('button', 'Futures').should('be.visible');
    cy.contains('button', 'Forex').should('be.visible');
    cy.contains('button', 'Opcije').should('be.visible');

    // Tab "Akcije" je aktivan po defaultu i prikazuje akcije
    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');

    // Prebaci na Futures
    cy.contains('button', 'Futures').click();
    cy.wait('@getFutures');
    cy.contains('CLZ26').should('be.visible');
    cy.contains('Crude Oil Dec 2026').should('be.visible');

    // Prebaci na Forex
    cy.contains('button', 'Forex').click();
    cy.wait('@getForex');
    cy.contains('EUR/USD').should('be.visible');
  });

  it('opcije se prikazuju unutar detalja akcije', () => {
    cy.wait('@getStocks');

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks/1' }, {
      statusCode: 200,
      body: {
        ...buildStocks()[0],
        options: [
          {
            listing_id: 101,
            option_type: 'CALL',
            settlement_date: '2025-06-20',
            strike: 420,
            price: 5.2,
            bid: 5.0,
            ask: 5.4,
            volume: 1000,
            open_interest: 5000,
            implied_volatility: 0.25,
          },
        ],
      },
    }).as('getStockDetails');

    cy.contains('MSFT').click();
    cy.wait('@getStockDetails');

    cy.contains('Opcije').should('be.visible');
    cy.contains('CALL').should('exist');
    cy.contains('420').should('exist');
  });
});
