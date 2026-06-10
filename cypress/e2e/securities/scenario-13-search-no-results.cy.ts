import { buildStocks, buildFutures, buildForex, loginAs, agentUser } from './helpers';

describe('Scenario 13: Pretraga hartije bez rezultata', () => {
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

  it('lista hartija je prazna i prikazuje se poruka kada nema rezultata', () => {
    cy.get('input[placeholder="Pretraži ticker ili naziv..."]').type('XYZNONEXISTENT999');

    cy.get('table tbody tr').should('not.exist');
    cy.contains('Nema hartija za prikaz.').should('be.visible');
  });
});
