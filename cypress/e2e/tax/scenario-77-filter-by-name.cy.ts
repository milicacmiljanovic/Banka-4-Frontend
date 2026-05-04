import { buildTaxUsers, loginAs, supervisorUser } from './helpers';

describe('Scenario 77: Filtriranje korisnika po imenu na portalu za porez', () => {
  it('lista se filtrira i prikazuje samo odgovarajuće korisnike', () => {
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers(),
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    cy.get('table tbody tr').should('have.length', 3);

    cy.get('input[placeholder="Ime..."]').type('Ana');

    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('Ana').should('be.visible');
    cy.contains('Jovana').should('not.exist');
    cy.contains('Milan').should('not.exist');
  });

  it('filtriranje po prezimenu prikazuje odgovarajuće korisnike', () => {
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers(),
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    cy.get('input[placeholder="Prezime..."]').type('Milić');

    cy.get('table tbody tr').should('have.length', 1);
    cy.contains('Milan').should('be.visible');
    cy.contains('Ana').should('not.exist');
  });
});
