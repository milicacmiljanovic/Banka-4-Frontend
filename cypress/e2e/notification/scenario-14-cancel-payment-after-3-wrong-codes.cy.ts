/// <reference types="cypress" />
export {};

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';

// Klijent tri puta unosi pogrešan verifikacioni kod.
// Backend vraća grešku i transakcija se otkazuje.
// POST /verify uvek mockovan — OTP se dobija van aplikacije.

const MOCK_ACCOUNT = {
  id: 1,
  account_number: '111000000000000001',
  name: 'Tekući račun RSD',
  balance: 100000,
  currency: 'RSD',
  daily_limit: 500000,
  monthly_limit: 2000000,
};

before(() => {
  cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
    email: 'marko.markovic@example.com',
    password: 'password123',
  }).then((loginRes) => {
    const token: string = loginRes.body.token;
    const clientId: number = loginRes.body.user?.client_id ?? loginRes.body.user?.id;
    return cy.request({
      method: 'GET',
      url: `http://localhost:5173/banking-service/api/clients/${clientId}/accounts`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  }).then((accountsRes) => {
    const accounts: any[] = Array.isArray(accountsRes.body)
      ? accountsRes.body
      : (accountsRes.body?.data ?? accountsRes.body?.items ?? []);
    Cypress.env('s14_markoHasAccounts', accounts.length > 0);
    cy.log(`S14: Marko ima ${accounts.length} račun(a)`);
  });
});

describe('Scenario 14: Transakcija se otkazuje nakon 3 pogrešna koda', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('klijent unese pogrešan kod i backend vraća grešku o otkazanoj transakciji', () => {
    const markoHasAccounts: boolean = Cypress.env('s14_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');

    // Svaki pokušaj sa pogrešnim kodom — backend vraća grešku (3. pokušaj → transakcija otkazana)
    let attemptCount = 0;
    cy.intercept('POST', '**/clients/*/payments', (req) => {
      attemptCount++;
      req.reply({ statusCode: 201, body: { id: 14000 + attemptCount } });
    }).as('createPayment');

    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 400,
      body: { message: 'Transakcija je otkazana — previše pogrešnih pokušaja verifikacije.' },
    }).as('verifyPayment');

    cy.visit('http://localhost:5173/client/payments/new');
    cy.wait('@getAccounts');

    // Helper: popuni formu i pošalji
    function fillAndSubmitForm() {
cy.contains('label', 'Račun platioca')
  .parent()
  .find('select')
  .then(($sel) => {
    const $options = $sel.find('option').filter((_, el: any) => el.value !== '');
    const firstOption = $options[0] as any;
    if (firstOption) {
      cy.wrap($sel).select(firstOption.value);
    }
  });
      cy.get('input[placeholder="Ime primaoca ili firme"]').clear().type('Test Primalac');
      cy.get('input[placeholder="000000000000000000"]').clear().type('111000000000000003');
      cy.get('input[placeholder="0.00"]').clear().type('50');
      cy.get('input[placeholder="npr. Plaćanje računa za internet"]').clear().type('Test');
    }

    // Pokušaj 1 — pogrešan kod
    fillAndSubmitForm();
    cy.contains('button', 'Nastavi →').click();
    cy.wait('@createPayment');
    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');
    cy.get('input[placeholder="000000"]').type('000000');
    cy.contains('button', 'Potvrdi plaćanje').click();
    cy.wait('@verifyPayment');

    // UI zatvara modal i prikazuje grešku na formi
    cy.contains('Transakcija je otkazana').should('be.visible');
  });

  it('sistem prikazuje poruku o neuspešnoj verifikaciji', () => {
    const markoHasAccounts: boolean = Cypress.env('s14_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 14099 },
    }).as('createPayment');
    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 400,
      body: { message: 'Pogrešan verifikacioni kod.' },
    }).as('verifyPayment');

    cy.visit('http://localhost:5173/client/payments/new');
    cy.wait('@getAccounts');

cy.contains('label', 'Račun platioca')
  .parent()
  .find('select')
  .then(($sel) => {
    const $options = $sel.find('option').filter((_, el: any) => el.value !== '');
    const firstOption = $options[0] as any;
    if (firstOption) {
      cy.wrap($sel).select(firstOption.value);
    }
  });
    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Greška Test');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000004');
    cy.get('input[placeholder="0.00"]').type('10');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Test');
    cy.contains('button', 'Nastavi →').click();
    cy.wait('@createPayment');

    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');
    cy.get('input[placeholder="000000"]').type('999999');
    cy.contains('button', 'Potvrdi plaćanje').click();
    cy.wait('@verifyPayment');

    // Modal se zatvara, greška se prikazuje na formi
    cy.contains('h3', 'Verifikacija plaćanja').should('not.exist');
    cy.contains('Pogrešan verifikacioni kod.').should('be.visible');
  });
});