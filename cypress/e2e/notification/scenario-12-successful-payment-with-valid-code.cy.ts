/// <reference types="cypress" />

// before() proverava da li Marko ima račune u banking servisu.
// Ako ima → prave račune učitavamo bez mocka.
// Ako nema → mockujemo listu računa.
// POST /payments i POST /verify su uvek mockovani — OTP se dobija van aplikacije (SMS/email).

const MOCK_ACCOUNT = {
  id: 1,
  account_number: '111000000000000001',
  name: 'Tekući račun RSD',
  balance: 100000,
  currency: 'RSD',
  daily_limit: 500000,
  monthly_limit: 2000000,
};

describe('Scenario 12: Uspešno plaćanje sa validnim verifikacionim kodom (mobilno odobrenje)', () => {
  before(() => {
    cy.request('POST', `${Cypress.env('API_URL')}/auth/login`, {
      email: Cypress.env('MARKO_EMAIL') as string,
      password: Cypress.env('MARKO_PASSWORD') as string,
    }).then((loginRes) => {
      const token: string = loginRes.body.token;
      const clientId: number = loginRes.body.user?.client_id ?? loginRes.body.user?.id;
      Cypress.env('s12_clientId', clientId);
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
      Cypress.env('s12_markoHasAccounts', accounts.length > 0);
      cy.log(`S12: Marko ima ${accounts.length} račun(a) u backendu`);
    });
  });

  beforeEach(() => {
    cy.loginAsClient();
  });

  it('klijent inicira plaćanje, backend ga odobrava i UI prikazuje uspeh', () => {
    const markoHasAccounts: boolean = Cypress.env('s12_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.log('Marko nema račune → koristimo mock');
      cy.intercept('GET', '**/clients/*/accounts', {
        statusCode: 200,
        body: [MOCK_ACCOUNT],
      }).as('getAccounts');
    } else {
      cy.log('Marko ima račune → koristimo prave podatke');
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 12001 },
    }).as('createPayment');
    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 200,
      body: { id: 12001, status: 'COMPLETED' },
    }).as('verifyPayment');

    cy.visit('/client/payments/new');
    cy.wait('@getAccounts');

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

    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Test Primalac');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000001');
    cy.get('input[placeholder="0.00"]').type('100');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Testno plaćanje');
    cy.contains('button', 'Nastavi →').click();

    cy.wait('@createPayment').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');
    cy.get('input[placeholder="000000"]').type('123456');
    cy.contains('button', 'Potvrdi plaćanje').click();

    cy.wait('@verifyPayment').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains('h2', 'Nalog je uspešno poslat!').should('be.visible');
  });
});
