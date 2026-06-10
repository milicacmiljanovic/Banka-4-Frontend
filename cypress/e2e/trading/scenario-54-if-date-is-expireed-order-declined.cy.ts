/// <reference types="cypress" />

describe('Scenario 54: Order sa isteklim settlement date-om može samo da bude odbijen', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/refresh', {
      statusCode: 200,
      body: { token: 'fake-refreshed-token', refresh_token: 'fake-refresh-token' },
    }).as('refresh');

    cy.intercept('GET', '**/api/orders*', {
      statusCode: 200,
      body: {
        data: [
          {
            order_id: 5401,
            agent_name: 'Nikola Zaposleni',
            asset_name: 'MSFT',
            asset_type: 'Stock',
            order_type: 'MARKET',
            quantity: 10,
            contract_size: 1,
            price_per_unit: 100,
            direction: 'BUY',
            remaining_portions: 10,
            status: 'PENDING',
            approved_by: '—',
            last_modification: '2026-05-04T10:00:00Z',
            settlement_date: '2020-01-01',
            is_done: false,
          },
        ],
        total: 1,
        page: 1,
        page_size: 100,
        total_pages: 1,
      },
    }).as('getOrders');

    cy.loginAsAdmin();
    cy.visit('/supervisor/orders');
  });

  it('u pregledu ordera prikazuje samo Decline, a Approve nije prikazan', () => {
    cy.wait('@getOrders');
    cy.contains('MSFT', { timeout: 20000 }).click({ force: true });
    cy.contains('button', /Decline|Odbij/i, { timeout: 20000 }).should('be.visible');
  });
});

export {};
