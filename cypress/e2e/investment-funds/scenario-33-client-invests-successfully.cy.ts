/// <reference types="cypress" />

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api'; // auth, login
const BANKING_SERVICE_URL = 'http://rafsi.davidovic.io:8081/api'; // accounts, clients
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api'; // investment-funds, orders

const ANA_EMAIL    = 'ana.anic@example.com';
const ANA_PASSWORD = 'password123';
const ANA_ACCOUNT  = '444000112345678913';

let authToken: string;
let investedFundId: number | null = null;
let investedAmount: number = 0;

describe('Scenario 33: Klijent uspešno investira u fond', () => {
  before(() => {
    // Pribavljamo token direktno, bez UI — koristimo ga samo za cleanup API pozive
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: ANA_EMAIL,
      password: ANA_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;

      // Setup: proveravamo da Ana ima dovoljno para pre nego što test počne
      const accountsUrl = `${BANKING_SERVICE_URL}/clients/${res.body.user?.id}/accounts`;
      cy.request({
        method: 'GET',
        url: accountsUrl,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((accountsRes) => {
        if (accountsRes.status !== 200) return;

        const accounts: any[] = accountsRes.body?.data ?? accountsRes.body ?? [];
        const targetAccount = accounts.find(
          (a: any) => String(a.account_number) === ANA_ACCOUNT
        );

        if (targetAccount) {
          const balance = Number(targetAccount.balance ?? targetAccount.available_balance ?? 0);
          expect(balance, `Ana mora imati bar 5000 RSD na računu ${ANA_ACCOUNT} pre testa`).to.be.greaterThan(5000);
        }
      });
    });
  });

  beforeEach(() => {
    investedFundId = null;
    investedAmount = 0;
    cy.loginAsClientAna();
  });

  afterEach(() => {
    // Cleanup: vraćamo uloženi iznos nazad na Anin račun
    // Izvršava se i kad test prođe i kad padne, da baza ostane čista
    if (!investedFundId || investedAmount <= 0) return;

    cy.request({
      method: 'POST',
      url: `${TRADING_SERVICE_URL}/investment-funds/${investedFundId}/withdraw`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        amount: investedAmount,
        account_number: ANA_ACCOUNT,
      },
      failOnStatusCode: false,
    });
  });

  it('kreira invest transakciju i osvežava klijentove pozicije', () => {
    const { normalizeNumber, extractFundsList } = require('./helpers');

    cy.intercept('GET', '**/api/investment-funds').as('getFunds');
    cy.intercept('GET', '**/api/investment-funds/*').as('getFundDetails');
    cy.intercept('GET', '**/clients/*/accounts*').as('getAccounts');
    cy.intercept('POST', '**/investment-funds/*/invest').as('investInFund');

    cy.visit('http://localhost:5173/investment-funds');

    cy.wait('@getFunds').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      const funds = extractFundsList(interception.response?.body);
      expect(funds.length, 'mora postojati bar jedan fond').to.be.greaterThan(0);

      const fund = funds.find((f: any) => (f.minimum_contribution ?? 0) <= 1000) || funds[0];
      const fundId = fund.fund_id ?? fund.id;
      expect(fundId, 'fund id must exist').to.exist;

      // Pamtimo fundId odmah - afterEach može da uradi cleanup čak i ako test pukne posle
      investedFundId = fundId;

      cy.visit(`http://localhost:5173/investment-funds/${fundId}`);
    });

    cy.wait('@getFundDetails').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      const details = interception.response?.body ?? {};
      const min = Math.max(1, normalizeNumber(details.min_investment));
      investedAmount = Math.max(5000, min);

      cy.contains('button', 'Investiraj').click();
      cy.wait('@getAccounts').then((a) => expect(a.response?.statusCode).to.eq(200));

      cy.contains('option', 'Savings Account — 444000112345678913').should('exist');
      cy.get('select').first().select(ANA_ACCOUNT);

      cy.get('input[placeholder="Unesite iznos..."]').clear().type(String(investedAmount));
      cy.contains('button', 'Potvrdi investiciju').click();

      cy.wait('@investInFund').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        expect(interception.request.body.amount).to.eq(investedAmount);
        expect(interception.request.body.account_number, 'account_number mora postojati').to.be.a('string').and.not.empty;

        const resBody = interception.response?.body ?? {};
        expect(resBody.fund_id, 'fund_id iz invest odgovora').to.exist;
        expect(resBody.fund_name, 'fund_name iz invest odgovora').to.be.a('string').and.not.empty;
        expect(resBody.total_invested_rsd, 'total_invested_rsd iz invest odgovora').to.exist;

        cy.contains(/Investicija uspešna|Investicija je uspešno/i).should('be.visible');
      });
    });
  });
});
