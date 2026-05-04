import { loginAs, supervisorUser } from './helpers';

// Dobit: 150 RSD × 15% = 22,50 RSD poreza
describe('Scenario 78: Automatski obračun poreza na kraju meseca', () => {
  it('sistem obračunava 15% poreza na kapitalnu dobit i prikazuje dugovanje', () => {
    const usersAfterCron = [
      {
        id: 10,
        firstName: 'Petar',
        lastName: 'Petrović',
        email: 'petar.petrovic@example.com',
        userType: 'client',
        taxOwedRsd: 22.5,
      },
    ];

    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: usersAfterCron,
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    cy.contains('22,50').should('be.visible');
    cy.contains('Petar').should('be.visible');
    cy.contains('Neplaćen').should('be.visible');
  });

  it('nema poreza za korisnika koji nije ostvario dobit', () => {
    const usersNoDue = [
      {
        id: 11,
        firstName: 'Luka',
        lastName: 'Lukić',
        email: 'luka.lukic@example.com',
        userType: 'client',
        taxOwedRsd: 0,
      },
    ];

    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: usersNoDue,
    }).as('getTaxUsersNoDue');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsersNoDue');

    cy.contains('0,00').should('be.visible');
    cy.contains('Bez duga').should('be.visible');
  });
});
