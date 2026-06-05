/// <reference types="cypress" />

describe('Scenario 55: Pregled ordera', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('supervizor odlazi na stranicu sa orederima', () => {
    cy.visit('http://localhost:5173/supervisor/orders');
  });
});

export {};
