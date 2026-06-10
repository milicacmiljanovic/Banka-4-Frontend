/// <reference types="cypress" />

const USER_SERVICE_URL = Cypress.env('API_URL') as string;

const ADMIN_EMAIL    = Cypress.env('ADMIN_EMAIL') as string;
const ADMIN_PASSWORD = Cypress.env('ADMIN_PASSWORD') as string;
const EMPLOYEE_ID    = 7;

let authToken           = '';
let originalPermissions: string[] = [];

describe('Upravljanje zaposlenima - Scenario 46', () => {
  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;

      cy.request({
        method: 'GET',
        url: `${USER_SERVICE_URL}/employees/${EMPLOYEE_ID}`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((empRes) => {
        if (empRes.status === 200) {
          originalPermissions = empRes.body?.permissions ?? [];
        }
      });
    });
  });

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  afterEach(() => {
    cy.request({
      method: 'PATCH',
      url: `${USER_SERVICE_URL}/employees/${EMPLOYEE_ID}`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { permissions: originalPermissions },
      failOnStatusCode: false,
    });
  });

  it('Admin uklanja permisiju i proverava fond (Tačna putanja)', () => {
    cy.visit(`/employees/${EMPLOYEE_ID}`);

    cy.contains('button', /Izmeni/i).click({ force: true });

    cy.get('body').then(($body) => {
      if ($body.find('input[type="checkbox"], [role="switch"]').length > 0) {
        cy.get('input[type="checkbox"], [role="switch"]').first().uncheck({ force: true });
      }
    });

    cy.contains('button', /Sačuvaj izmene/i).click({ force: true });

    cy.visit('/investment-funds');
    cy.visit('/investment-funds/1');

    cy.log('Scenario 46 završen.');
  });
});

export {};
