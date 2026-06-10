/// <reference types="cypress" />

export {};

const USER_SERVICE_URL = Cypress.env('API_URL') as string;
const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

const targetTicker = 'CERS';
let createdOrderId: number | null = null;
let apiToken: string | null = null;

describe('Scenario 73: Kupovina hartije kroz UI i provera u portfoliju (Sa API Rollback-om)', () => {

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: Cypress.env('ANA_EMAIL') as string,
      password: Cypress.env('ANA_PASSWORD') as string,
    }).then((res) => {
      expect(res.status).to.eq(200);
      apiToken = res.body.token;
    });
  });

  beforeEach(() => {
    createdOrderId = null;
    cy.loginAsClientAna();
  });

  it('prolazi kroz ceo proces kupovine hartije od vrednosti', () => {
    cy.intercept('POST', '**/api/orders').as('createOrderCall');

    cy.visit('/client/securities');
    cy.get('table', { timeout: 10000 }).should('be.visible');
    cy.contains('table tbody tr', targetTicker).click();

    cy.contains('button', 'Kupi').scrollIntoView().click({ force: true });

    cy.get('select').eq(1).should('not.contain', 'Učitavanje...').select(1, { force: true });
    cy.get('input[type="number"]').first().clear().type('1');
    cy.contains('button', 'Nastavi').click({ force: true });

    cy.contains(/Potvrda/i, { timeout: 8000 }).should('be.visible');
    cy.contains('button', 'Potvrdi').click({ force: true });

    cy.wait('@createOrderCall', { timeout: 15000 }).then((interception) => {
      expect(interception.response?.statusCode).to.be.within(200, 299);

      if (interception.response?.body) {
        createdOrderId = interception.response.body.id ?? null;
        cy.log(`Uspešno uhvaćen Order ID za rollback: ${createdOrderId}`);
      }

      cy.visit('/client/portfolio');
      cy.get('table', { timeout: 15000 }).should('be.visible');
      cy.contains('table tbody tr td', targetTicker).should('be.visible');
    });
  });

  afterEach(() => {
    if (!createdOrderId || !apiToken) {
      cy.log('Nema kreiranog Order ID-ja ili tokena, preskačem API rollback.');
      return;
    }

    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/orders/${createdOrderId}/cancel`,
      headers: { Authorization: `Bearer ${apiToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      cy.log(`Cleanup završen. Status: ${res.status}. Order ${createdOrderId} otkazan.`);
    });
  });
});
