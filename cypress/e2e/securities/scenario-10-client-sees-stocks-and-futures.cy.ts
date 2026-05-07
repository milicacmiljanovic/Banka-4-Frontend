import { buildStocks, buildFutures, buildForex, loginAs } from './helpers';
import type { TestUser } from './helpers';

const clientUser: TestUser = {
  id: 1001,
  first_name: 'Marko',
  last_name: 'Marković',
  email: 'marko@example.com',
  identity_type: 'client',
  permissions: ['trade'],
};

describe('Scenario 10: Klijent vidi samo akcije i futures ugovore', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/listings/stocks/**', {
      statusCode: 200,
      body: {},
    });
    cy.intercept('GET', '**/api/listings/stocks*', {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/api/listings/futures*', {
      statusCode: 200,
      body: [buildFutures()],
    }).as('getFutures');

    cy.intercept('GET', '**/api/listings/forex*').as('getForex');

    loginAs(clientUser, '/client/securities');
  });

  it('vidi tabove za akcije i futures', () => {
    cy.wait('@getStocks');

    cy.contains('button', 'Akcije').should('be.visible');
    cy.contains('button', 'Futures').should('be.visible');
  });

  it('ne vidi tabove za forex i opcije', () => {
    cy.wait('@getStocks');

    cy.contains('button', 'Forex').should('not.exist');
    cy.contains('button', 'Opcije').should('not.exist');

    // 🔥 bitno
    cy.get('@getForex.all').should('have.length', 0);
  });

  it('ne vidi sekciju sa opcijama u detaljima hartije', () => {
  cy.wait('@getStocks');

  // klik na neku hartiju (npr MSFT)
  cy.contains('MSFT').click();

  // proveri da se otvorio detalj (npr ticker gore desno)
  cy.contains('MSFT').should('be.visible');

  // 🔥 KLJUCNO — nema opcija
  cy.contains('Opcije').should('not.exist');

  // dodatno: nema CALLS/PUTS tabele
  cy.contains('CALLS').should('not.exist');
  cy.contains('PUTS').should('not.exist');
  });

  it('akcije se prikazuju u tabeli', () => {
    cy.wait('@getStocks');

    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');
  });

  it('futures se prikazuju nakon klika na tab', () => {
    cy.wait('@getStocks');

    cy.contains('button', 'Futures').click();
    cy.wait('@getFutures');

    cy.contains('CLZ26').should('be.visible');
  });
});


