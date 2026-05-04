import { buildTaxUsers, loginAs, supervisorUser } from './helpers';

describe('Scenario 79: Ručno pokretanje obračuna poreza od strane supervizora', () => {
  it('supervizor pokreće obračun i sistem prikazuje potvrdu uspešnog izvršenja', () => {
    // Inicijalni GET — intercept registrovan pre navigacije
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers(),
    }).as('getTaxUsers');

    cy.intercept({ method: 'POST', pathname: '/api/tax/collect' }, {
      statusCode: 200,
      body: { message: 'Tax collection completed.' },
    }).as('collectTax');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    // Re-registruj intercept za drugi GET (refetch nakon obračuna)
    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: buildTaxUsers().map(u => ({ ...u, taxOwedRsd: 0 })),
    }).as('getTaxUsersAfter');

    // Klikni "Pokreni sve obračune"
    cy.contains('button', 'Pokreni sve obračune').click();

    // Modal se otvorio
    cy.contains('Pokreni obračun i naplatu poreza za sve korisnike').should('be.visible');
    cy.contains('15%').should('be.visible');

    // Klikni "Pokreni obračun" u modalu
    cy.contains('button', 'Pokreni obračun').click();

    cy.wait('@collectTax').its('response.statusCode').should('eq', 200);

    // Prikazuje se poruka o uspešnom izvršenju
    cy.contains('Obračun poreza je uspešno pokrenut za sve korisnike.').should('be.visible');
  });
});
