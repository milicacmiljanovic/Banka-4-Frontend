/// <reference types="cypress" />

describe('Scenario 55: Pregled ordera', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('supervizor odlazi na stranicu sa orederima', () => {
    cy.visit('/supervisor/orders');
    cy.get('table', { timeout: 10000 }).should('be.visible');
  });
});

export {};
