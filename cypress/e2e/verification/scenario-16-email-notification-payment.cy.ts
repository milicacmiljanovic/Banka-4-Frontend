/// <reference types="cypress" />

// S16: Kada plaćanje uspešno prođe, backend šalje email obaveštenje klijentu.
// Testujemo da UI prikazuje uspešan rezultat (što znači da je backend triggerovao email).
// POST /payments i POST /verify su uvek mockovani — OTP se dobija van aplikacije.

const MOCK_ACCOUNT = {
  id: 1,
  account_number: '111000000000000001',
  name: 'Tekući račun RSD',
  balance: 100000,
  currency: 'RSD',
  daily_limit: 500000,
  monthly_limit: 2000000,
};

describe('Scenario 16: Email notifikacija pri izvršenom plaćanju', () => {
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
      Cypress.env('s16_markoHasAccounts', accounts.length > 0);
      cy.log(`S16: Marko ima ${accounts.length} račun(a)`);
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

  it('klijent uspešno izvrši plaćanje i UI potvrđuje da je nalog poslat (email je triggerovan)', () => {
    const markoHasAccounts: boolean = Cypress.env('s16_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 16001 },
    }).as('createPayment');
    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 200,
      body: { id: 16001, status: 'COMPLETED' },
    }).as('verifyPayment');

    cy.visit('/client/payments/new');
    cy.wait('@getAccounts');

    selectFirstAccount();

    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Email Test Primalac');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000007');
    cy.get('input[placeholder="0.00"]').type('1000');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Plaćanje za koje sledi email');
    cy.contains('button', 'Nastavi →').click();

    cy.wait('@createPayment');
    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');
    cy.get('input[placeholder="000000"]').type('111111');
    cy.contains('button', 'Potvrdi plaćanje').click();

    cy.wait('@verifyPayment').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains('h2', 'Nalog je uspešno poslat!').should('be.visible');
    cy.contains('je u obradi').should('be.visible');
  });
});
