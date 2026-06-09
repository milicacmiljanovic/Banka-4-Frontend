/// <reference types="cypress" />
export {};

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';


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
    Cypress.env('s22_pendingOrderId', pendingOrders.length > 0 ? (pendingOrders[0].id ?? null) : null);
    cy.log(`S22: pronađeno ${pendingOrders.length} PENDING order(a) u backendu`);
  });
});

describe('Scenario 22: Notifikacija kada supervizor odbije order', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('supervizor vidi PENDING order, klika Decline i order prelazi u DECLINED', () => {
    const realPendingId: number | null = Cypress.env('s22_pendingOrderId') ?? null;
    const mockOrderId = 9002;

    if (realPendingId === null) {
      cy.log('Nema PENDING ordera u backendu → koristimo mock');
      cy.intercept('GET', '**/api/orders*', {
        statusCode: 200,
        body: [{
          id: mockOrderId,
          status: 'PENDING',
          direction: 'SELL',
          order_type: 'LIMIT',
          quantity: 5,
          remaining_portions: 5,
          price_per_unit: 200.0,
          contract_size: 1,
          asset_name: 'MSFT',
          asset_type: 'Stock',
          settlement_date: null,
          last_modification: new Date().toISOString(),
        }],
      }).as('getOrders');
      cy.intercept('PATCH', `**/orders/${mockOrderId}/decline`, {
        statusCode: 200,
        body: { id: mockOrderId, status: 'DECLINED' },
      }).as('declineOrder');
    } else {
      cy.log(`Koristimo pravi PENDING order ID: ${realPendingId}`);
      cy.intercept('GET', '**/api/orders*').as('getOrders');
      cy.intercept('PATCH', `**/orders/${realPendingId}/decline`).as('declineOrder');
    }

    cy.visit('http://localhost:5173/supervisor/orders');
    cy.wait('@getOrders').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.contains('button', 'Pending').click();
    cy.get('table').contains('button', /^Decline$/).click();

    cy.wait('@declineOrder').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
      expect(interception.request.url).to.match(/\/orders\/\d+\/decline/);
    });

    cy.contains(/Order je uspešno odbijen|odbijen/i).should('be.visible');
  });
});
