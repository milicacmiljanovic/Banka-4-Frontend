/// <reference types="cypress" />

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api'; // auth, audit-log

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

let authToken: string;

describe('Celina 3 - Scenario 40: Promena limita agentu se beleži u audit log', () => {
  before(() => {
    // Setup: admin token. U punoj integraciji bismo ovde PATCH-om promenili limit
    // agentu (100.000 -> 150.000) da nastane audit zapis; ovde taj "Given" seed-ujemo
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
    // Cleanup: audit zapisi su nepromenljivi (immutable) — nema čišćenja.
    expect(authToken, 'token je pribavljen u setup-u').to.be.a('string');
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
      // tip akcije
      cy.contains('Promena limita agentu').should('exist');
      // ko je promenio
      cy.contains('Sanja Supervizor').should('exist');
      // stara i nova vrednost
      cy.contains('100.000').should('exist');
      cy.contains('150.000').should('exist');
      // kada — vremenska kolona nije prazna
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
