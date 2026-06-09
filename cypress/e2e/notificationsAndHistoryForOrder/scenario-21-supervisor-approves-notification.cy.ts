/// <reference types="cypress" />
export {};

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

// before() proverava da li u backendu postoje PENDING orderi.
// Ako postoje → test koristi pravi ID i pravi PATCH.
// Ako ne postoje → test koristi mock PENDING order (fallback).

before(() => {
  cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
    email: 'admin@raf.rs',
    password: 'admin123',
  }).then((loginRes) => {
    const token: string = loginRes.body.token;
    return cy.request({
      method: 'GET',
      url: `${TRADING_SERVICE_URL}/orders?page=1&page_size=100`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  }).then((ordersRes) => {
    const orders: any[] = Array.isArray(ordersRes.body)
      ? ordersRes.body
      : (ordersRes.body?.data ?? ordersRes.body?.items ?? ordersRes.body?.content ?? []);
    const pendingOrders = orders.filter((o) => o.status === 'PENDING');
    Cypress.env('s21_pendingOrderId', pendingOrders.length > 0 ? (pendingOrders[0].id ?? null) : null);
    cy.log(`S21: pronađeno ${pendingOrders.length} PENDING order(a) u backendu`);
  });
});

describe('Scenario 21: Notifikacija kada supervizor odobri order', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('supervizor vidi PENDING order, klika Approve i order prelazi u APPROVED', () => {
    const realPendingId: number | null = Cypress.env('s21_pendingOrderId') ?? null;
    const mockOrderId = 9001;

    if (realPendingId === null) {
      cy.log('Nema PENDING ordera u backendu → koristimo mock');
      cy.intercept('GET', '**/api/orders*', {
        statusCode: 200,
        body: [{
          id: mockOrderId,
          status: 'PENDING',
          direction: 'BUY',
          order_type: 'MARKET',
          quantity: 10,
          remaining_portions: 10,
          price_per_unit: 150.0,
          contract_size: 1,
          asset_name: 'AAPL',
          asset_type: 'Stock',
          settlement_date: null,
          last_modification: new Date().toISOString(),
        }],
      }).as('getOrders');
      cy.intercept('PATCH', `**/orders/${mockOrderId}/approve`, {
        statusCode: 200,
        body: { id: mockOrderId, status: 'APPROVED' },
      }).as('approveOrder');
    } else {
      cy.log(`Koristimo pravi PENDING order ID: ${realPendingId}`);
      cy.intercept('GET', '**/api/orders*').as('getOrders');
      cy.intercept('PATCH', `**/orders/${realPendingId}/approve`).as('approveOrder');
    }

    cy.visit('http://localhost:5173/supervisor/orders');
    cy.wait('@getOrders').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.contains('button', 'Pending').click();
    cy.get('table').contains('button', /^Approve$/).click();

    cy.wait('@approveOrder').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
      expect(interception.request.url).to.match(/\/orders\/\d+\/approve/);
    });

    cy.contains(/Order je uspešno odobren|odobren/i).should('be.visible');
  });
});
