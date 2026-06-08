/// <reference types="cypress" />

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

let authToken: string;

describe('Celina 3 - Scenario 42: Promena permisija se beleži u audit log', () => {
  before(() => {
    // Setup: admin token. "Given" (admin je dodao permisiju zaposlenom) se seed-uje
    // kroz intercept audit-log odgovora.
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  afterEach(() => {
    // Cleanup: audit zapisi su nepromenljivi — nema čišćenja.
    expect(authToken, 'token je pribavljen u setup-u').to.be.a('string');
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
      // tip akcije
      cy.contains('Promena permisija').should('exist');
      // ko je dodao
      cy.contains('Ana Admin').should('exist');
      // kome
      cy.contains('Petar Petrović').should('exist');
      // koja permisija
      cy.contains('Upravljanje klijentima').should('exist');
      // kada — kolona nije prazna
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
