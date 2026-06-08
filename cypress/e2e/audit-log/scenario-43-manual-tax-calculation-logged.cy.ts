/// <reference types="cypress" />

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

let authToken: string;

describe('Celina 3 - Scenario 43: Ručni obračun poreza se beleži u audit log', () => {
  before(() => {
    // Setup: admin token. "Given" (supervizor je pokrenuo ručni obračun poreza) se
    // seed-uje kroz intercept audit-log odgovora.
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
      // tip akcije
      cy.contains('Rucni obracun poreza').should('exist');
      // ko je pokrenuo
      cy.contains('Sanja Supervizor').should('exist');
      // kada — kolona nije prazna
      cy.get('td').eq(0).should('not.have.text', '-');
    });
  });
});
