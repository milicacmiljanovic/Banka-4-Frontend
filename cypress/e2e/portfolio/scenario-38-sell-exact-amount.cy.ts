/// <reference types="cypress" />

export {};

const USER_SERVICE_URL = Cypress.env('API_URL') as string;
const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

let authToken: string;
let createdOrderId: number | null = null;

describe('Scenario 38: Prodaja tačnog broja hartija', () => {

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
    createdOrderId = null;
    cy.loginAsClientAna();
    cy.visit('/client/portfolio');
    cy.get('table').should('be.visible');
  });

  afterEach(() => {
    if (!createdOrderId) return;

    cy.request({
      method: 'POST',
      url: `${TRADING_SERVICE_URL}/orders/${createdOrderId}/cancel`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      cy.log(`Cleanup executed for order ${createdOrderId}. Status: ${res.status}`);
    });
  });

  it('uspešno šalje order kada je količina jednaka posedovanoj', () => {
    cy.intercept('POST', '**/orders').as('realOrderRequest');

    cy.get('table').should('be.visible');

    cy.get('table th').then(($headers) => {
      const amountIndex = $headers.toArray().findIndex(th => th.innerText.includes('AMOUNT'));
      const finalIndex = amountIndex !== -1 ? amountIndex : 2;

      cy.contains('table tbody tr', 'CERS').then(($row) => {
        const rawAmount = $row.find('td').eq(finalIndex).text().trim();
        const ownedAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));

        expect(ownedAmount, 'Količina mora biti validan broj').to.not.be.NaN;

        cy.wrap($row).find('button').contains('SELL').click({ force: true });

        cy.get('select').eq(1).should('not.contain', 'Učitavanje...');
        cy.get('select').last().select(1, { force: true });

        cy.get('input[type="number"], input[placeholder*="Max"]').filter(':visible').first()
          .clear()
          .type(ownedAmount.toString(), { delay: 50 });

        cy.contains('button', 'Nastavi').should('be.visible').click({ force: true });

        cy.contains(/Potvrda/i, { timeout: 8000 }).should('be.visible');
        cy.contains('button', /Potvrdi|Confirm/i).click({ force: true });

        cy.wait('@realOrderRequest', { timeout: 10000 }).then((interception) => {
          expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
          const resBody = interception.response?.body ?? {};
          const orderId = resBody.order_id ?? resBody.id;
          if (orderId) {
            createdOrderId = orderId;
            cy.log(`Uhvaćen order ID za cleanup: ${createdOrderId}`);
          }
        });

        cy.get('body').then(($body) => {
          if ($body.text().includes('uspešno') || $body.text().includes('u obradi') || $body.text().includes('success')) {
            cy.log('Poruka o uspehu uspešno verifikovana na ekranu!');
          } else {
            cy.get('form').should('not.exist');
          }
        });
      });
    });
  });
});
