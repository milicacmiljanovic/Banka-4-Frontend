import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 12: Pretraga hartije po ticker-u', () => {
  it('lista se filtrira i prikazuje samo hartije čiji ticker odgovara unetom kriterijumu', () => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

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
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.get('input[placeholder="Pretraži ticker ili naziv..."]').type('Apple');

    cy.contains('AAPL').should('be.visible');
    cy.contains('Apple Inc.').should('be.visible');
    cy.contains('MSFT').should('not.exist');
  });
});
