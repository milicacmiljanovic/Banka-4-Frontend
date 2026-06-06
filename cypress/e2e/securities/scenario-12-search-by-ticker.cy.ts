import { buildStocks, buildFutures, buildForex, loginAs, agentUser } from './helpers';

describe('Scenario 12: Pretraga hartije po ticker-u', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/listings/stocks*', {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/listings/futures*', {
      statusCode: 200,
      body: [buildFutures()],
    });

    cy.intercept('GET', '**/listings/forex*', {
      statusCode: 200,
      body: buildForex(),
    });

    cy.intercept('GET', '**/listings/options*', {
      statusCode: 200,
      body: [],
    });

    cy.intercept('GET', '**/otc/offers/active*', {
      statusCode: 200,
      body: [],
    });

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');
  });

  it('lista se filtrira i prikazuje samo hartije čiji ticker odgovara unetom kriterijumu', () => {
    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');
    cy.contains('JPM').should('be.visible');

    cy.get('input[placeholder="Pretraži ticker ili naziv..."]').type('MSFT');

    cy.contains('MSFT').should('be.visible');
    cy.contains('Microsoft Corporation').should('be.visible');
    cy.contains('AAPL').should('not.exist');
    cy.contains('JPM').should('not.exist');
  });

  it('pretraga po nazivu kompanije takođe radi', () => {
    cy.get('input[placeholder="Pretraži ticker ili naziv..."]').type('Apple');

    cy.contains('AAPL').should('be.visible');
    cy.contains('Apple Inc.').should('be.visible');
    cy.contains('MSFT').should('not.exist');
  });
});
