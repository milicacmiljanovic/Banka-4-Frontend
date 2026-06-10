/// <reference types="cypress" />

describe('Celina 3 - Scenario 40: Promena limita agentu se beleži u audit log', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('prikazuje zapis sa ko je promenio, kada, stara 100.000 i nova vrednost 150.000', () => {
    cy.intercept('GET', '**/api/audit-log*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5040,
            action_type: 'AGENT_LIMIT_CHANGED',
            actor: { first_name: 'Sanja', last_name: 'Supervizor' },
            target: { first_name: 'Milan', last_name: 'Marković' },
            created_at: '2026-06-08T10:15:00Z',
            details: { old_limit: 100000, new_limit: 150000 },
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
      cy.contains('Promena limita agentu').should('exist');
      cy.contains('Sanja Supervizor').should('exist');
      cy.contains('100.000').should('exist');
      cy.contains('150.000').should('exist');
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
