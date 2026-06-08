/// <reference types="cypress" />
import { visitEmployeeLogin, fillLoginForm, submitLogin } from '../../support/authHelpers';
import { fillInputByLabel, fillDateByLabel, selectByLabel } from '../../support/formByLable';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

const EXISTING_EMAIL = 'petar@banka.rs';

describe('Celina 1 - Scenario 3: Email već postoji u sistemu', () => {
  beforeEach(() => {
    // Given: admin je prijavljen i na stranici za kreiranje zaposlenog
    cy.intercept('POST', '**/auth/login').as('login');
    visitEmployeeLogin();
    fillLoginForm(ADMIN_EMAIL, ADMIN_PASSWORD);
    submitLogin();
    cy.wait('@login').its('response.statusCode').should('eq', 200);
  });

  it('odbija kreiranje i prikazuje poruku da email mora biti jedinstven', () => {
    // Given: u sistemu već postoji nalog sa istim emailom -> backend vraća 409
    cy.intercept('POST', '**/employees/register', {
      statusCode: 409,
      body: { message: 'Email mora biti jedinstven' },
    }).as('registerEmployee');

    cy.visit('/employees/new');
    cy.contains('h1', 'Kreiranje novog zaposlenog').should('be.visible');

    fillInputByLabel('Ime', 'Petar');
    fillInputByLabel('Prezime', 'Petrović');
    fillInputByLabel('Email adresa', EXISTING_EMAIL);
    fillInputByLabel('Broj telefona', '+381641234567');
    fillDateByLabel('Datum rođenja', '1990-03-15');
    selectByLabel('Pol', 'M');
    fillInputByLabel('ID Pozicije', '1');
    fillInputByLabel('Departman', 'IT');
    fillInputByLabel('Username', 'ppetrovic');

    cy.contains('label', 'employee.view')
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.contains('button[type="submit"]', 'Kreiraj zaposlenog').click();

    // Then: sistem odbija kreiranje
    cy.wait('@registerEmployee').its('response.statusCode').should('eq', 409);

    // And: prikazuje se poruka da email mora biti jedinstven
    cy.contains('Email mora biti jedinstven', { timeout: 10000 }).should('be.visible');

    // ostaje na formi (nema redirekcije na /employees)
    cy.url().should('include', '/employees/new');
  });
});
