/// <reference types="cypress" />

describe('Celina 3 - Scenario 42: Promena permisija se beleži u audit log', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('prikazuje zapis sa ko je dodao permisiju, kome, koja permisija i kada', () => {
    cy.intercept('GET', '**/api/audit-log*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 5042,
            action_type: 'EMPLOYEE_PERMISSIONS_CHANGED',
            actor: { first_name: 'Ana', last_name: 'Admin' },
            target: { first_name: 'Petar', last_name: 'Petrović' },
            created_at: '2026-06-08T09:30:00Z',
            details: { permissions: ['Upravljanje klijentima'] },
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

    cy.contains('tr', 'Ana Admin').within(() => {
      cy.contains('Promena permisija').should('exist');
      cy.contains('Ana Admin').should('exist');
      cy.contains('Petar Petrović').should('exist');
      cy.contains('Upravljanje klijentima').should('exist');
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
