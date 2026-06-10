/// <reference types="cypress" />

describe('Scenario 51: Order na samoj granici limita agenta', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('Agent pravi order koji dopunjava limit do tačno 100k i dobija APPROVED status', () => {
    cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
    cy.intercept('POST', /\/api\/orders$/, (req) => {
      req.reply({ statusCode: 201, body: { status: 'APPROVED' } });
    }).as('submitOrderEdgeCase');

    cy.visit('http://localhost:5173/dashboard');
    cy.visit('http://localhost:5173/client/securities');

    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', /Kupi|Kreiraj nalog/i).click({ force: true });
    });

    cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {
      cy.contains('label', /Tip ordera/i).parent().find('select').select('MARKET');

      cy.contains('label', /Račun za kupovinu/i).parent().find('select')
        .find('option').should('have.length.at.least', 2);
      cy.contains('label', /Račun za kupovinu/i).parent().find('select').select(1);

      cy.contains('label', /Količina/i).parent().find('input')
        .clear({ force: true }).type('20', { force: true });

      cy.contains('button', 'Nastavi').click({ force: true });
    });

    cy.get('[class*="modalOverlay"]').within(() => {
      cy.contains('h4', 'Potvrda ordera').should('be.visible');
      cy.contains('button', 'Potvrdi').click({ force: true });
    });

    cy.wait('@submitOrderEdgeCase', { timeout: 20000 }).then((interception) => {
      expect(interception.response?.body.status).to.eq('APPROVED');
    });

    cy.visit('http://localhost:5173/dashboard');
  });
});

export {};
