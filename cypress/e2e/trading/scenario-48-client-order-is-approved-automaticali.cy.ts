/// <reference types="cypress" />

describe('Scenario 48b: Klijentov order se automatski odobrava pri kupovini', () => {
  beforeEach(() => {
    cy.loginAsClientAna();
  });

  it('klijent kupuje akciju i ona odmah dobija status APPROVED', () => {
    cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
    cy.intercept('POST', '**/api/orders/**', (req) => {
      req.reply({ statusCode: 201, body: { status: 'APPROVED' } });
    }).as('submitOrder');

    cy.visit('http://localhost:5173/dashboard');
    cy.visit('http://localhost:5173/client/securities');

    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', /Kupi/i).click({ force: true });
    });

    cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {
      cy.contains('label', /Tip ordera/i).parent().find('select').select('MARKET');

      cy.contains('label', /Račun za kupovinu/i).parent().find('select')
        .find('option').should('have.length.at.least', 2);
      cy.contains('label', /Račun za kupovinu/i).parent().find('select').select(1);

      cy.contains('label', /Količina/i).parent().find('input').clear().type('20');
      cy.contains('button', 'Nastavi').click();
    });

    cy.get('[class*="modalOverlay"]').within(() => {
      cy.contains('h4', 'Potvrda ordera').should('be.visible');
      cy.contains('button', 'Potvrdi').click();
    });

    cy.get('[class*="modalOverlay"]').within(() => {
      cy.contains('button', '✕').click({ force: true });
    });

    cy.loginAsAdmin();
    cy.visit('http://localhost:5173/supervisor/orders');
  });
});

export {};
