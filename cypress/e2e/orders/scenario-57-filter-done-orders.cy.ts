describe('Scenario 57: Filtriranje ordera po statusu Done', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/auth/refresh', {
      statusCode: 200,
      body: {
        token: 'fake-refreshed-token',
        refresh_token: 'fake-refresh-token',
      },
    }).as('refresh');

    cy.intercept('GET', '**/api/orders*', {
      statusCode: 200,
      body: {
        data: [
          {
            order_id: 101,
            agent_name: 'Aca Agent',
            asset_name: 'AAPL',
            asset_type: 'Stock',
            order_type: 'MARKET',
            quantity: 10,
            contract_size: 1,
            price_per_unit: 188.5,
            direction: 'BUY',
            remaining_portions: 0,
            status: 'DONE',
            approved_by: 'Admin',
            last_modification: '2026-03-17T09:30:00Z',
            settlement_date: null,
            is_done: true,
          },
          {
            order_id: 102,
            agent_name: 'Aca Agent',
            asset_name: 'MSFT',
            asset_type: 'Stock',
            order_type: 'LIMIT',
            quantity: 5,
            contract_size: 1,
            price_per_unit: 415.2,
            direction: 'SELL',
            remaining_portions: 0,
            status: 'DONE',
            approved_by: 'Admin',
            last_modification: '2026-03-17T10:00:00Z',
            settlement_date: null,
            is_done: true,
          },
          {
            order_id: 103,
            agent_name: 'Aca Agent',
            asset_name: 'JPM',
            asset_type: 'Stock',
            order_type: 'MARKET',
            quantity: 3,
            contract_size: 1,
            price_per_unit: 195,
            direction: 'BUY',
            remaining_portions: 1,
            status: 'PENDING',
            approved_by: '—',
            last_modification: '2026-03-17T11:00:00Z',
            settlement_date: null,
            is_done: false,
          },
        ],
        total: 3,
        page: 1,
        page_size: 100,
        total_pages: 1,
      },
    }).as('getOrders');

    cy.loginAsAdmin();
    cy.visit('/supervisor/orders');
  });

  it('prikazuje samo ordere koji su u potpunosti izvršeni', () => {
    cy.wait('@getOrders');

    cy.contains('AAPL').should('be.visible');
    cy.contains('JPM').should('be.visible');

    cy.contains('button', 'Done').click();

    cy.contains('AAPL').should('be.visible');
    cy.contains('MSFT').should('be.visible');
    cy.contains('JPM').should('not.exist');
  });
});