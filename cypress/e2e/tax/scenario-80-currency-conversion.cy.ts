import { loginAs, supervisorUser } from './helpers';

// Backend vrši konverziju EUR → RSD i vraća taxOwedRsd već u RSD.
// Frontend samo prikazuje taj iznos u koloni "Dugovanje (RSD)".
describe('Scenario 80: Porez se konvertuje u RSD za korisnike sa računima u stranoj valuti', () => {
  it('dugovanje je prikazano u RSD bez obzira na valutu računa korisnika', () => {
    const userWithEurAccount = [
      {
        id: 20,
        firstName: 'Nikola',
        lastName: 'Nikolić',
        email: 'nikola.nikolic@example.com',
        userType: 'client',
        taxOwedRsd: 877.5,
      },
    ];

    cy.intercept({ method: 'GET', pathname: '/api/tax' }, {
      statusCode: 200,
      body: userWithEurAccount,
    }).as('getTaxUsers');

    loginAs(supervisorUser, '/tax');
    cy.wait('@getTaxUsers');

    cy.contains('th', 'Dugovanje (RSD)').should('be.visible');
    cy.contains('877,50').should('be.visible');
    cy.contains('Neplaćen').should('be.visible');
  });
});
