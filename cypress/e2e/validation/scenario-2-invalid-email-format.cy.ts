/// <reference types="cypress" />
import { visitEmployeeLogin, fillLoginForm, submitLogin } from '../../support/authHelpers';
import { fillInputByLabel, fillDateByLabel, selectByLabel } from '../../support/formByLable';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

describe('Celina 1 - Scenario 2: Email nije validnog formata', () => {
  beforeEach(() => {
    // Given: admin je prijavljen i na stranici za kreiranje zaposlenog
    cy.intercept('POST', '**/auth/login').as('login');
    visitEmployeeLogin();
    fillLoginForm(ADMIN_EMAIL, ADMIN_PASSWORD);
    submitLogin();
    cy.wait('@login').its('response.statusCode').should('eq', 200);
  });

  it('odbija kreiranje i prikazuje poruku o nevalidnom formatu email adrese', () => {
    // Ako bi se i poslao zahtev — pratimo ga da dokažemo da se NE šalje
    cy.intercept('POST', '**/employees/register').as('registerEmployee');

    cy.visit('/employees/new');
    cy.contains('h1', 'Kreiranje novog zaposlenog').should('be.visible');

    // Sva ostala polja su validna, samo je email bez @ znaka
    fillInputByLabel('Ime', 'Petar');
    fillInputByLabel('Prezime', 'Petrović');
    fillInputByLabel('Email adresa', 'petar.banka'); // nedostaje @
    fillInputByLabel('Broj telefona', '+381641234567');
    fillDateByLabel('Datum rođenja', '1990-03-15');
    selectByLabel('Pol', 'M');
    fillInputByLabel('ID Pozicije', '1');
    fillInputByLabel('Departman', 'IT');
    fillInputByLabel('Username', 'ppetrovic');

    cy.contains('button[type="submit"]', 'Kreiraj zaposlenog').click();

    // Then: prikazuje se poruka o nevalidnom formatu
    cy.contains('Email adresa nije ispravna').should('be.visible');

    // And: sistem odbija kreiranje -> zahtev ka serveru se NE šalje, ostaje na formi
    cy.get('@registerEmployee.all').should('have.length', 0);
    cy.url().should('include', '/employees/new');
  });
});
