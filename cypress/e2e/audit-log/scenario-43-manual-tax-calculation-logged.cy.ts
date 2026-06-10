/// <reference types="cypress" />

describe('Celina 3 - Scenario 43: Ručni obračun poreza se beleži u audit log', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('prikazuje zapis sa ko je pokrenuo obračun i kada', () => {
    cy.intercept('GET', '**/api/audit-log*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5043,
            action_type: 'MANUAL_TAX_CALCULATION_STARTED',
            actor: { first_name: 'Sanja', last_name: 'Supervizor' },
            created_at: '2026-06-08T08:00:00Z',
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
      cy.contains(/ručni obračun poreza/i).should('exist');
      cy.contains('Sanja Supervizor').should('exist');
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
