/// <reference types="cypress" />

describe('Celina 3 - Scenario 41: Odobravanje ordera se beleži u audit log', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('prikazuje zapis sa imenom supervizora, id-jem ordera i timestamp-om odobravanja', () => {
    cy.intercept('GET', '**/api/audit-log*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5041,
            action_type: 'ORDER_APPROVED',
            actor: { first_name: 'Sanja', last_name: 'Supervizor' },
            created_at: '2026-06-08T11:00:00Z',
            details: { order_id: 7777 },
          },
        ],
        total_pages: 1,
        page: 1,
        page_size: 20,
        total: 1,
      },
    }).as('getAuditLog');

    cy.visit('/admin/audit-log');
    cy.wait('@getAuditLog').its('response.statusCode').should('eq', 200);

    cy.contains('h1', 'Audit log').should('be.visible');

    cy.contains('tr', 'Sanja Supervizor').within(() => {
      cy.contains('Order odobren').should('exist');
      cy.contains('Sanja Supervizor').should('exist');
      cy.contains('7777').should('exist');
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
