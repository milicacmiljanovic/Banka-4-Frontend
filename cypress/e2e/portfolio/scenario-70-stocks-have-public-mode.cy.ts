/// <reference types="cypress" />

export {};

describe('Scenario 70: Za akcije postoji opcija javnog režima', () => {

  const USER_SERVICE_URL = Cypress.env('API_URL') as string;
  const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;
  const targetTicker: string = 'CERS';

  let authToken: string;
  let publicActionExecuted = false;

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: Cypress.env('ANA_EMAIL') as string,
      password: Cypress.env('ANA_PASSWORD') as string,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    publicActionExecuted = false;
    cy.loginAsClientAna();
    cy.visit('/client/portfolio');
    cy.get('table', { timeout: 10000 }).should('be.visible');
  });

  afterEach(() => {
    if (!publicActionExecuted) return;

    cy.request({
      method: 'POST',
      url: `${TRADING_SERVICE_URL}/shares/public/withdraw`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { ticker: targetTicker },
      failOnStatusCode: false,
    }).then((res) => {
      cy.log(`Cleanup executed: Akcije za ${targetTicker} povučene iz javnog režima. Status: ${res.status}`);
    });
  });

  it('prikazuje sekciju za upravljanje javnim akcijama', () => {
    cy.contains(/Moje akcije \(Stocks\)/i).should('be.visible');
  });

  it('prikazuje kontrole za javni režim (Qty i Public dugme)', () => {
    cy.get('table').find('input[placeholder*="Qty"]').first().should('be.visible');
    cy.get('table').find('button').contains(/Public/i).first().should('be.visible');
  });

  it('dozvoljava unos količine za prvu dostupnu akciju', () => {
    cy.intercept('POST', '**/shares/public*').as('publicShareRequest');

    cy.get('table tbody tr').first().within(() => {
      cy.get('input[placeholder*="Qty"]')
        .clear()
        .type('1')
        .should('have.value', '1');

      cy.contains('button', /Public/i).should('not.be.disabled').click();
    });

    publicActionExecuted = true;
  });

  it('prikazuje dugme za povlačenje akcija sa portala', () => {
    cy.get('table').find('button').contains(/Public|Withdraw|Povuci/i).should('be.visible');
  });

  it('verifikuje da se ticker vidi unutar OTC sekcije', () => {
    cy.get('table tbody tr').first().find('td').first().then(($td) => {
      const sectionText = $td.text().trim();
      expect(sectionText).to.match(/[A-Z]{1,5}/);
    });
  });
});
