/// <reference types="cypress" />
export {};

const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';

// Klijent dobija kod na mobilnom i unosi ga ručno na web aplikaciji.
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
    Cypress.env('s13_markoHasAccounts', accounts.length > 0);
    cy.log(`S13: Marko ima ${accounts.length} račun(a)`);
  });
});

describe('Scenario 13: Uspešno plaćanje unosom koda sa mobilnog', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('klijent vidi modal za verifikaciju, unosi 6-cifreni kod i plaćanje je potvrđeno', () => {
    const markoHasAccounts: boolean = Cypress.env('s13_markoHasAccounts') ?? false;

    if (!markoHasAccounts) {
      cy.intercept('GET', '**/clients/*/accounts', { statusCode: 200, body: [MOCK_ACCOUNT] }).as('getAccounts');
    } else {
      cy.intercept('GET', '**/clients/*/accounts').as('getAccounts');
    }

    cy.intercept('GET', '**/payees').as('getPayees');
    cy.intercept('POST', '**/clients/*/payments', {
      statusCode: 201,
      body: { id: 13001 },
    }).as('createPayment');
    cy.intercept('POST', '**/clients/*/payments/*/verify', {
      statusCode: 200,
      body: { id: 13001, status: 'COMPLETED' },
    }).as('verifyPayment');

    cy.visit('http://localhost:5173/client/payments/new');
    cy.wait('@getAccounts');

cy.contains('label', 'Račun platioca')
  .parent()
  .find('select')
  .then(($sel) => {
    // Dodat any tip za el i eksplicitno kastovanje celog niza
    const $options = $sel.find('option').filter((_, el: any) => el.value !== '');
    const firstOption = $options[0] as any;
    
    if (firstOption) {
      cy.wrap($sel).select(firstOption.value);
    }
  });

    cy.get('input[placeholder="Ime primaoca ili firme"]').type('Petra Petrović');
    cy.get('input[placeholder="000000000000000000"]').type('111000000000000002');
    cy.get('input[placeholder="0.00"]').type('500');
    cy.get('input[placeholder="npr. Plaćanje računa za internet"]').type('Uplata po ugovoru');
    cy.contains('button', 'Nastavi →').click();

    cy.wait('@createPayment');

    // Modal se pojavljuje sa poljem za unos koda
    cy.contains('h3', 'Verifikacija plaćanja').should('be.visible');
    cy.contains('Unesite 6-cifreni kod').should('be.visible');

    // Korisnik unosi kod primljen putem SMS/email poruke (simuliran)
    cy.get('input[placeholder="000000"]').should('be.visible').type('654321');
    expect('654321'.length).to.eq(6);

    cy.contains('button', 'Potvrdi plaćanje').should('not.be.disabled').click();

    cy.wait('@verifyPayment').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      expect(interception.request.body).to.deep.include({ code: '654321' });
    });

    cy.contains('h2', 'Nalog je uspešno poslat!').should('be.visible');
  });
});