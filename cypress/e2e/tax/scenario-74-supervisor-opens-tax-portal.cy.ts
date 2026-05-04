import { buildTaxUsers, loginAs, supervisorUser } from './helpers';

describe('Scenario 74: Supervizor pristupa portalu za porez tracking', () => {
  it('vidi listu svih korisnika sa dugovanjima iskazanim u RSD', () => {
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers(),
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');

    cy.wait('@getTaxUsers').its('response.statusCode').should('eq', 200);

    cy.contains('h1', 'Porez na kapitalnu dobit').should('be.visible');

    cy.contains('th', 'Korisnik').should('be.visible');
    cy.contains('th', 'Dugovanje (RSD)').should('be.visible');

    cy.get('table tbody tr').should('have.length', 3);

    cy.contains('Ana').should('be.visible');
    cy.contains('Jovana').should('be.visible');
    cy.contains('Milan').should('be.visible');

    cy.contains('300,00').should('be.visible');
    cy.contains('150,00').should('be.visible');
  });
});
