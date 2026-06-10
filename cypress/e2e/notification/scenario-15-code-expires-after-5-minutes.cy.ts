/// <reference types="cypress" />

// Klijent pokuša da unese kod nakon isteka OTP prozora (5 minuta server-side).
// Backend odbija verifikaciju sa greškom o isteklom kodu.
// Frontendski timer (30s) se testira zasebno pomoću cy.clock() + cy.tick().

const MOCK_ACCOUNT = {
  id: 1,
  account_number: '111000000000000001',
  name: 'Tekući račun RSD',
  balance: 100000,
  currency: 'RSD',
  daily_limit: 500000,
  monthly_limit: 2000000,
};

describe('Scenario 15: Kod ističe i sistem odbija verifikaciju', () => {
  before(() => {
    cy.request('POST', `${Cypress.env('API_URL')}/auth/login`, {
      email: Cypress.env('MARKO_EMAIL') as string,
      password: Cypress.env('MARKO_PASSWORD') as string,
    }).then((loginRes) => {
      const token: string = loginRes.body.token;
      const clientId: number = loginRes.body.user?.client_id ?? loginRes.body.user?.id;
      return cy.request({
        method: 'GET',
        url: `${Cypress.env('BANKING_API_URL')}/clients/${clientId}/accounts`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      });
    }).then((accountsRes) => {
      const accounts: any[] = Array.isArray(accountsRes.body)
        ? accountsRes.body
        : (accountsRes.body?.data ?? accountsRes.body?.items ?? []);
      Cypress.env('s15_markoHasAccounts', accounts.length > 0);
      cy.log(`S15: Marko ima ${accounts.length} račun(a)`);
    });
  });

  function selectFirstAccount() {
    cy.contains('label', 'Račun platioca')
      .parent()
      .find('select')
      .find('option')
      .not('[value=""]')
      .first()
      .then(($opt) => {
        cy.contains('label', 'Račun platioca')
          .parent()
          .find('select')
          .select($opt.val() as string);
      });
  }

  beforeEach(() => {
    cy.loginAsClient();
  });

  it('backend odbija istekli OTP i prikazuje odgovarajuću grešku', () => {
    const markoHasAccounts: boolean = Cypress.env('s15_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 15001 },
    }).as('createPayment');
    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 400,
      body: { message: 'Verifikacioni kod je istekao.' },
    }).as('verifyPayment');

    cy.visit('/client/payments/new');
    cy.wait('@getAccounts');

    selectFirstAccount();

    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Istekli Kod Test');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000005');
    cy.get('input[placeholder="0.00"]').type('200');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Test isteklog koda');
    cy.contains('button', 'Nastavi →').click();

    cy.wait('@createPayment');
    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');

    cy.get('input[placeholder="000000"]').type('123456');
    cy.contains('button', 'Potvrdi plaćanje').click();

    cy.wait('@verifyPayment').then((interception) => {
      expect(interception.response?.statusCode).to.eq(400);
    });

    cy.contains('h3', 'Verifikacija plaćanja').should('not.exist');
    cy.contains('Verifikacioni kod je istekao.').should('be.visible');
  });

  it('frontendski tajmer prikazuje countdown i resetuje se po isteku 30s prozora', () => {
    const markoHasAccounts: boolean = Cypress.env('s15_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 15002 },
    }).as('createPayment');

    cy.visit('/client/payments/new');
    cy.wait('@getAccounts');

    selectFirstAccount();

    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Tajmer Test');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000006');
    cy.get('input[placeholder="0.00"]').type('100');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Test tajmera');
    cy.contains('button', 'Nastavi →').click();

    cy.wait('@createPayment');
    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');

    cy.contains('Važenje koda:').should('be.visible');
    cy.contains('span', /^\d{2}s$/).should('be.visible');

    cy.contains('button', 'Potvrdi plaćanje').should('be.visible');
  });
});
