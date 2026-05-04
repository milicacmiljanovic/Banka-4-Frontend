import { buildTaxUsers, loginAs, supervisorUser } from './helpers';

describe('Scenario 76: Filtriranje korisnika po tipu na portalu za porez', () => {
  it('lista prikazuje samo klijente kada se filtrira po tipu "Klijent"', () => {
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers(),
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    // Svi korisnici prikazani pre filtriranja (2 klijenta + 1 aktuar)
    cy.get('table tbody tr').should('have.length', 3);

    // Izaberi tip "Klijent" u dropdown-u za tim
    cy.get('select').first().select('Klijent');

    // Sada su vidljivi samo klijenti
    cy.get('table tbody tr').should('have.length', 2);
    cy.get('table tbody').contains('Klijent').should('be.visible');
    cy.get('table tbody').contains('Aktuar').should('not.exist');

    // Ana i Jovana su klijenti
    cy.contains('Ana').should('be.visible');
    cy.contains('Jovana').should('be.visible');
    cy.contains('Milan').should('not.exist');
  });
});
