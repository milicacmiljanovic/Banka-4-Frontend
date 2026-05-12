import { clientNoTrading, loginAs } from './helpers';

describe('Scenario 15: Klijent bez permisije nema pristup OTC portalu', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/clients/*/accounts*', { statusCode: 200, body: { data: [] } });
    cy.intercept('GET', '**/transfers/history*', { statusCode: 200, body: { data: [] } });
    cy.intercept('GET', '**/payees*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/exchange/rates*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/clients/*', { statusCode: 200, body: {} });
  });

  it('ne vidi OTC Portal dugme u navigaciji klijentskog dashboarda', () => {
    loginAs(clientNoTrading, '/dashboard');
    cy.contains('button', 'OTC Portal').should('not.exist');
  });

  it('OTC Portal link nije dostupan u client header navigaciji', () => {
    loginAs(clientNoTrading, '/dashboard');
    cy.get('body').should('be.visible');
    cy.contains(/OTC Portal/i).should('not.exist');
  });
});
