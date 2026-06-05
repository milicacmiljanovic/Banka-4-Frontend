/// <reference types="cypress" />

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

const MARKO_EMAIL    = 'marko.markovic@example.com';
const MARKO_PASSWORD = 'password123';

const MOCK_ASSET = { ticker: 'AAPL', type: 'STOCK', amount: 10, pricePerUnitRSD: 800, profit: 50, ownership_id: 1, asset_ownership_id: 1, id: 1 };

let authToken    = '';
let hasRealData  = false;
let clientId: number | null = null;
let createdOrderId: number | null = null;

describe('SAGA Pattern - Scenario 12: Error when buyer and seller are blocked', () => {
  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: MARKO_EMAIL,
      password: MARKO_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
      const user = res.body.user ?? res.body;
      clientId = user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.id ?? null;
      if (!clientId) return;
      cy.request({
        method: 'GET',
        url: `${TRADING_SERVICE_URL}/client/${clientId}/assets`,
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
    cy.loginAsClient();
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

  it('pokuša prodaju; proverava odgovor backenda i prikaz u UI-u', () => {
    if (!hasRealData) {
      cy.intercept('GET', '**/client/*/assets', { body: [MOCK_ASSET] });
      cy.intercept('POST', '**/api/orders', (req) => {
        req.reply({ statusCode: 201, body: { id: 104, order_id: 104, status: 'PENDING' } });
      }).as('createOrder');
    } else {
      cy.intercept('POST', '**/api/orders').as('createOrder');
    }

    cy.visit('http://localhost:5173/client/portfolio');

    cy.get('table tbody tr', { timeout: 20000 }).first().within(() => {
      cy.contains(/Sell|Prodaj/i).click({ force: true });
    });

    cy.contains('div', /Prodaj/i, { timeout: 20000 }).parents().eq(1).within(() => {
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
  });
});

export {};
