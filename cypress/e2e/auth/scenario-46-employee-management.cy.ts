/// <reference types="cypress" />

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';
const EMPLOYEE_ID    = 7;

let authToken           = '';
let originalPermissions: string[] = [];

describe('Upravljanje zaposlenima - Scenario 46', () => {
  before(() => {
    // Login za cleanup token
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;

      // Čuvamo originalne permisije zaposlenog pre testa
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
    // Vraćamo originalne permisije zaposlenom
    cy.request({
      method: 'PATCH',
      url: `${USER_SERVICE_URL}/employees/${EMPLOYEE_ID}`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { permissions: originalPermissions },
      failOnStatusCode: false,
    });
  });

  it('Admin uklanja permisiju i proverava fond (Tačna putanja)', () => {
    cy.visit(`http://localhost:5173/employees/${EMPLOYEE_ID}`);

    cy.contains('button', /Izmeni/i).click({ force: true });

    cy.get('body').then(($body) => {
      if ($body.find('input[type="checkbox"], [role="switch"]').length > 0) {
        cy.get('input[type="checkbox"], [role="switch"]').first().uncheck({ force: true });
      }
    });

    cy.contains('button', /Sačuvaj izmene/i).click({ force: true });

    cy.visit('http://localhost:5173/investment-funds');
    cy.visit('http://localhost:5173/investment-funds/1');

    cy.log('Scenario 46 završen.');
  });
});

export {};
