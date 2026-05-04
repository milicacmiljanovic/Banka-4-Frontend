import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 13: Pretraga hartije bez rezultata', () => {
  it('lista hartija je prazna i prikazuje se poruka kada nema rezultata', () => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.get('input[placeholder="Pretraži ticker ili naziv..."]').type('XYZNONEXISTENT999');

    cy.get('table tbody tr').should('not.exist');
    cy.contains('Nema hartija za prikaz.').should('be.visible');
  });
});
