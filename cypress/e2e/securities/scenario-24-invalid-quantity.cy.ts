import { buildStocks, loginAs, agentUser, primaryAccount } from './helpers';

describe('Scenario 24: Nevalidna količina ordera', () => {

  beforeEach(() => {
  cy.intercept('GET', '**/api/listings/stocks*', {
    statusCode: 200,
    body: buildStocks(),
  }).as('getStocks');

  cy.intercept('GET', '**/accounts**', {
    statusCode: 200,
    body: { data: [primaryAccount] },
  }).as('getAccounts');

  loginAs(agentUser, '/securities');

  cy.url().should('include', '/securities');

  // 🔥 prvo čekaj tabelu
  cy.get('table').should('exist');

  // 🔥 onda čekaj da se napuni
  cy.wait('@getStocks');

  // 🔥 TEK SAD MSFT
  cy.contains('tbody tr', 'MSFT').should('be.visible');

  cy.contains('tbody tr', 'MSFT')
    .contains('button', /Kreiraj nalog|Kupi/)
    .click();

  cy.wait('@getAccounts');

  cy.get('input[type="number"]').should('be.visible');
  cy.get('select').select(1);
});

  it('prikazuje grešku za količinu 0', () => {
    cy.get('input[type="number"]')
      .clear()
      .type('0');

    cy.contains(/količina mora biti/i).should('be.visible');
  });

  it('prikazuje grešku za negativnu količinu', () => {
    cy.get('input[type="number"]')
      .clear()
      .type('-5');

    cy.contains(/količina mora biti/i).should('be.visible');
  });

  it('dugme Nastavi je disabled', () => {
    cy.get('input[type="number"]')
      .clear()
      .type('0');

    cy.contains('button', 'Nastavi').should('be.disabled');
  });

});