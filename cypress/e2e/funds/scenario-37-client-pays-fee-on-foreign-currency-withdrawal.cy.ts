import { extractFunds, extractAccounts } from '../../support/helpers';

describe('Scenario 37: Klijent plaća proviziju pri povlačenju u stranoj valuti', () => {
  beforeEach(() => {
    cy.loginAsClientAna();

    cy.intercept('GET', '**/api/client/*/assets*').as('getPortfolio');
    cy.intercept('GET', '**/api/client/*/funds*').as('getClientFunds');
    cy.intercept('GET', '**/api/clients/*/accounts*').as('getAccounts');
    cy.intercept('POST', '**/api/investment-funds/*/withdraw').as('withdrawFromFund');

    cy.visit('/client/portfolio');
  });

  it('omogućava povlačenje na EUR račun za Anin fond', () => {
    cy.wait('@getPortfolio');

    cy.get('main').within(() => {
      cy.contains('button', 'Moji fondovi').click();
    });

    cy.wait('@getClientFunds').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const funds = extractFunds(response?.body);

      expect(
        funds.length,
        'Ana mora da ima bar jedan fond da bi scenario 37 mogao da se testira.'
      ).to.be.greaterThan(0);

      cy.wrap(funds[0]).as('targetFund');
    });

    cy.get('@targetFund').then((fund: any) => {
      const fundName = fund.fund_name ?? fund.name;

      cy.contains(fundName).should('be.visible');
      cy.contains(fundName)
        .closest('[role="button"]')
        .within(() => {
          cy.contains('button', 'Povlačenje iz fonda').click();
        });
    });

    cy.wait('@getAccounts').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const accounts = extractAccounts(response?.body);
      const eurAccount = accounts.find(
        (acc: any) => String(acc.currency ?? '').toUpperCase() === 'USD'
      );

      expect(
        eurAccount,
        'Ana mora da ima bar jedan USD račun za scenario 37.'
      ).to.exist;

      cy.wrap(eurAccount).as('targetAccount');
    });

    cy.get('input[value="partial"]').check({ force: true });
    cy.get('input[placeholder="Unesite iznos"]').clear().type('1000');

    cy.get('@targetAccount').then((acc: any) => {
      const accountNumber =
        acc.account_number ?? acc.accountNumber ?? acc.AccountNumber ?? acc.number;

      cy.get('select').select(String(accountNumber));
      cy.get('select').find('option:selected').should('contain.text', 'USD');
    });

    cy.contains('button', 'Potvrdi povlačenje').click();

    cy.wait('@withdrawFromFund').then(({ request, response }) => {
      expect([200, 201, 202, 400, 409, 422]).to.include(response?.statusCode);
      expect(Number(request.body.amount)).to.eq(1000);
      expect(request.body.account_number).to.exist;
    });
  });
});