import { clientUser, loginAs } from './helpers';

describe('Scenario 75: Klijent nema pristup portalu za porez tracking', () => {
  it('pristup je odbijen i klijent je preusmeren sa /tax', () => {
    loginAs(clientUser, '/tax');

    cy.contains('h1', 'Porez na kapitalnu dobit').should('not.exist');
    cy.url().should('not.include', '/tax');
  });
});
