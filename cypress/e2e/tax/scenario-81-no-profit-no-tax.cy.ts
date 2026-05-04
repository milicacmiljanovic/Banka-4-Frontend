import { loginAs, supervisorUser } from './helpers';

describe('Scenario 81: Nema poreza ako nije ostvarena dobit', () => {
  it('korisnik koji nije ostvario dobit ima porez 0 RSD i nema skidanja sredstava', () => {
    const usersNoDue = [
      {
        id: 30,
        firstName: 'Stefan',
        lastName: 'Stefanović',
        email: 'stefan.stefanovic@example.com',
        userType: 'client',
        taxOwedRsd: 0,
      },
    ];

    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: usersNoDue,
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    // Dugovanje je 0,00 RSD
    cy.contains('td', '0,00').should('be.visible');

    // Status je "Bez duga" u tabeli (ne u dropdown filteru)
    cy.get('table tbody').contains('Bez duga').should('be.visible');

    // Status "Neplaćen" nije prikazan u tabeli
    cy.get('table tbody').contains('Neplaćen').should('not.exist');
  });
});
