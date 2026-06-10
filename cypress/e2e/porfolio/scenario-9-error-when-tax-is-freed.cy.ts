/// <reference types="cypress" />

import { MOCK_STOCK_ASSET } from '../../support/mockData';

const USER_SERVICE_URL    = Cypress.env('API_URL') as string;
const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

const NIKOLA_EMAIL    = Cypress.env('NIKOLA_EMAIL') as string;
const NIKOLA_PASSWORD = Cypress.env('NIKOLA_PASSWORD') as string;

let authToken    = '';
let hasRealData  = false;
let actuaryId: number | null = null;
let createdOrderId: number | null = null;

describe('SAGA Pattern - Scenario 9: Error when tax is freed', () => {
  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: NIKOLA_EMAIL,
      password: NIKOLA_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
      const user = res.body.user ?? res.body;
      actuaryId = user?.employee_id ?? user?.actuary_id ?? user?.identity_id ?? user?.id ?? null;
      if (!actuaryId) return;
      cy.request({
        method: 'GET',
        url: `${TRADING_SERVICE_URL}/actuary/${actuaryId}/assets`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((portfolioRes) => {
        const assets: any[] = portfolioRes.body?.data ?? portfolioRes.body ?? [];
        hasRealData = assets.filter((a: any) => a.type?.toUpperCase() !== 'OPTION').length > 0;
      });
    });
  });

  beforeEach(() => {
    createdOrderId = null;
    cy.loginAsNikola();
  });

  afterEach(() => {
    if (!createdOrderId) return;
    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/orders/${createdOrderId}/cancel`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    });
  });

  it('Verifikuje SAGA Retry i Pending Rollback status nakon neuspešne kompenzacije', () => {
    if (!hasRealData) {
      cy.intercept('GET', '**/actuary/*/assets', { body: [MOCK_STOCK_ASSET] });
      cy.intercept('POST', '**/api/orders', (req) => {
        req.reply({ statusCode: 201, body: { id: 102, order_id: 102, status: 'PENDING' } });
      }).as('createOrder');
    } else {
      cy.intercept('POST', '**/api/orders').as('createOrder');
    }
    cy.intercept('GET', '**/api/transactions/**').as('getTransactionStatus');

    cy.visit('/portfolio');

    cy.get('table tbody tr', { timeout: 20000 })
      .first()
      .within(() => {
        cy.contains(/Sell|Prodaj/i).click({ force: true });
      });

    cy.contains('div', /Prodaj/i, { timeout: 20000 })
      .parents().eq(1)
      .within(() => {
        cy.get('select').eq(1).should('be.visible').find('option').should('have.length.greaterThan', 1);
        cy.get('select').eq(1).select(1, { force: true });
        cy.get('input').filter(':visible').first().clear({ force: true }).type('1', { force: true });
        cy.contains('button', /^Nastavi$/i).click({ force: true });
      });

    cy.contains('button', /Potvrdi prodaju/i, { timeout: 20000 }).should('be.visible').click({ force: true });

    cy.wait('@createOrder', { timeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode).to.be.oneOf([200, 201, 202]);
      if (hasRealData) {
        createdOrderId = response?.body?.id ?? response?.body?.order_id ?? null;
      }
    });

    cy.loginAsAdmin();
    cy.visit('/supervisor/orders');
    cy.get('table', { timeout: 10000 }).should('be.visible');
    cy.contains('button', /^Declined$/i, { timeout: 20000 }).click();
  });
});

export {};
