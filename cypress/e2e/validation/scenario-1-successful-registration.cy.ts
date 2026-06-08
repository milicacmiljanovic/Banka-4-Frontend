/// <reference types="cypress" />
import { visitEmployeeLogin, fillLoginForm, submitLogin } from '../../support/authHelpers';
import { fillInputByLabel, fillDateByLabel, selectByLabel } from '../../support/formByLable';

const ADMIN_EMAIL    = 'admin@raf.rs';
const ADMIN_PASSWORD = 'admin123';

const PETAR_EMAIL = 'petar@banka.rs';
const PETAR_PHONE = '+381641234567';
const PETAR_DATE  = '1990-03-15'; // 15-03-1990 u formatu koji input[type=date] očekuje

describe('Celina 1 - Scenario 1: Uspešna registracija sa validnim podacima', () => {
  beforeEach(() => {
    // Given: admin je prijavljen (UI login — isti tok kao ostali employee testovi)
    cy.intercept('POST', '**/auth/login').as('login');
    visitEmployeeLogin();
    fillLoginForm(ADMIN_EMAIL, ADMIN_PASSWORD);
    submitLogin();
    cy.wait('@login').its('response.statusCode').should('eq', 200);
  });

  it('kreira nalog sa validnim podacima i ne prikazuje nijednu grešku', () => {
    cy.intercept('POST', '**/employees/register', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          data: { id: 99001, ...req.body },
          message: 'Employee created successfully',
        },
      });
    }).as('registerEmployee');

    // Pažnja: glob mora da sadrži "/api/employees?" da NE bi slučajno presreo
    // Vite modul /src/api/endpoints/employees.js (gde "?" hvata tačku pre "js").
    cy.intercept('GET', '**/api/employees?*', {
      statusCode: 200,
      body: { data: [], total_pages: 1, page: 1, page_size: 20 },
    }).as('employeesList');

    cy.visit('/employees/new');
    cy.contains('h1', 'Kreiranje novog zaposlenog').should('be.visible');

    fillInputByLabel('Ime', 'Petar');
    fillInputByLabel('Prezime', 'Petrović');
    fillInputByLabel('Email adresa', PETAR_EMAIL);
    fillInputByLabel('Broj telefona', PETAR_PHONE);
    fillInputByLabel('Adresa', 'Knez Mihailova 1, Beograd');
    fillDateByLabel('Datum rođenja', PETAR_DATE);
    selectByLabel('Pol', 'M');
    fillInputByLabel('ID Pozicije', '1');
    fillInputByLabel('Departman', 'IT');
    fillInputByLabel('Username', 'ppetrovic');

    cy.contains('label', 'employee.view')
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.contains('button[type="submit"]', 'Kreiraj zaposlenog').click();

    cy.wait('@registerEmployee').then(({ request, response }) => {
      expect(response?.statusCode, 'sistem uspešno kreira nalog').to.eq(201);

      // proveravamo da su validni podaci tačno prosleđeni
      expect(request.body.email).to.eq(PETAR_EMAIL);
      expect(request.body.phone_number).to.eq(PETAR_PHONE);
      expect(request.body.date_of_birth).to.eq(`${PETAR_DATE}T00:00:00Z`);
    });

    // Then: ne prikazuje se nijedna greška
    cy.contains('Email adresa nije ispravna').should('not.exist');
    cy.contains('Broj telefona nije ispravan').should('not.exist');
    cy.contains('Polje je obavezno').should('not.exist');

    cy.wait('@employeesList');
    cy.url().should('include', '/employees');
  });
});
