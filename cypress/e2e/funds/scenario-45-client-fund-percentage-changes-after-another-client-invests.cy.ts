const AUTH_API = 'http://rafsi.davidovic.io:8080/api';
const BANKING_API = 'http://rafsi.davidovic.io:8081/api';
const TRADING_API = 'http://rafsi.davidovic.io:8082/api';

function pickArray(body: any) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function loginOnly(email: string, password: string) {
  return cy.request('POST', `${AUTH_API}/auth/login`, { email, password }).then((res) => {
    expect(res.status).to.eq(200);
    return res.body;
  });
}

function loginAndVisit(email: string, password: string, path: string) {
  return loginOnly(email, password).then((body) => {
    const { user, token, refresh_token } = body;

    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
        if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
        else win.localStorage.removeItem('refreshToken');
        win.localStorage.setItem('user', JSON.stringify(user));
      },
    });

    return cy.wrap(body);
  });
}

function getClientId(user: any) {
  return user?.client_id ?? user?.identity_id ?? user?.id;
}

function getFundId(fund: any) {
  return fund?.fund_id ?? fund?.id;
}

function getFundName(fund: any) {
  return fund?.fund_name ?? fund?.name ?? '';
}

function getFundPercent(fund: any) {
  return Number(
    fund?.clients_share_percent ??
    fund?.client_share_percentage ??
    0
  );
}

function fetchClientFunds(token: string, clientId: string | number) {
  return cy.request({
    method: 'GET',
    url: `${TRADING_API}/client/${clientId}/funds`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
}

function fetchAllBankAccounts(token: string) {
  return cy.request({
    method: 'GET',
    url: `${BANKING_API}/accounts?page=1&page_size=200`,
    headers: { Authorization: `Bearer ${token}` },
  });
}

function findInternalBankAccount(accounts: any[]) {
  return accounts.find((a) => {
    const type = String(a.AccountType ?? a.account_type ?? '').toLowerCase();
    const companyId = Number(a.CompanyID ?? a.company_id ?? 0);
    return type === 'bank' && companyId === 1;
  });
}

function getAccountNumber(account: any) {
  return String(
    account?.AccountNumber ??
    account?.account_number ??
    account?.accountNumber ??
    ''
  );
}

function investInFund(token: string, fundId: string | number, accountNumber: string, amount: number) {
  return cy.request({
    method: 'POST',
    url: `${TRADING_API}/investment-funds/${fundId}/invest`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      account_number: accountNumber,
      amount,
    },
    failOnStatusCode: false,
  });
}

describe('Scenario 45: Procenat fonda klijenta se menja kada admin uplati u isti fond', () => {
  const anaEmail = 'ana.anic@example.com';
  const anaPassword = 'password123';

  const adminEmail = 'admin@raf.rs';
  const adminPassword = 'admin123';

  it('procenat klijenta A se smanjuje nakon admin uplate u isti fond', () => {
    let anaToken = '';
    let anaClientId: string | number;
    let adminToken = '';

    let targetFundId: string | number;
    let targetFundName = '';
    let percentBefore = 0;

    // 1) Login kao Ana i uzmi Alpha Growth Fund
    loginOnly(anaEmail, anaPassword).then((body) => {
      anaToken = body.token;
      anaClientId = getClientId(body.user);

      expect(anaClientId, 'Ana mora imati client id').to.exist;
    });

    cy.then(() => fetchClientFunds(anaToken, anaClientId)).then((res) => {
      expect(res.status).to.eq(200);

      const funds = pickArray(res.body);
      expect(funds.length, 'Ana mora imati bar jedan fond').to.be.greaterThan(0);

      const alphaFund = funds.find((f: any) => {
        const name = getFundName(f).toLowerCase();
        return name.includes('alpha growth fund');
      });

      expect(alphaFund, 'Ana mora imati Alpha Growth Fund').to.exist;

      targetFundId = getFundId(alphaFund);
      targetFundName = getFundName(alphaFund);
      percentBefore = getFundPercent(alphaFund);

      expect(targetFundId, 'Alpha Growth Fund mora imati id').to.exist;
      expect(percentBefore, 'Početni procenat mora biti > 0').to.be.greaterThan(0);
    });

    // 2) Login kao admin
    loginOnly(adminEmail, adminPassword).then((body) => {
      adminToken = body.token;
    });

    // 3) Admin ulaže 1000 u isti fond koristeći interni bankovni račun
    cy.then(() => fetchAllBankAccounts(adminToken)).then((accountsRes) => {
      expect(accountsRes.status).to.eq(200);

      const bankAccounts = pickArray(accountsRes.body);
      expect(bankAccounts.length, 'Moraju postojati bankovni računi').to.be.greaterThan(0);

      const bankAccount = findInternalBankAccount(bankAccounts);
      expect(
        bankAccount,
        'Mora postojati interni bankovni račun (AccountType=bank, CompanyID=1)'
      ).to.exist;

      const accountNumber = getAccountNumber(bankAccount);
      expect(accountNumber, 'Interni bankovni račun mora imati broj').to.not.equal('');

      return investInFund(adminToken, targetFundId, accountNumber, 2000);
    }).then((investRes: any) => {
      expect(
        [200, 201],
        `Admin uplata nije uspela: ${JSON.stringify(investRes.body)}`
      ).to.include(investRes.status);
    });

    // 4) Poll dok se Ani ne smanji procenat
    function pollAnaFunds(attempt = 0): Cypress.Chainable {
      return cy.then(() => fetchClientFunds(anaToken, anaClientId)).then((res) => {
        expect(res.status).to.eq(200);

        const funds = pickArray(res.body);
        const updatedFund = funds.find((f: any) => String(getFundId(f)) === String(targetFundId));

        expect(updatedFund, 'Ciljni fond mora postojati kod Ane').to.exist;

        const percentAfter = getFundPercent(updatedFund);

        if (percentAfter < percentBefore) {
          expect(percentAfter, 'Procenat klijenta A treba da se smanji').to.be.lessThan(percentBefore);
          return cy.wrap(updatedFund).as('updatedFund');
        }

        if (attempt >= 8) {
          throw new Error(`Procenat se nije smanjio. Pre: ${percentBefore}, posle: ${percentAfter}`);
        }

        cy.wait(1000);
        return pollAnaFunds(attempt + 1);
      });
    }

    pollAnaFunds();

    // 5) UI provera da se fond i dalje vidi Ani
    loginAndVisit(anaEmail, anaPassword, '/portfolio');

    cy.contains(/^Moji fondovi$/i).click();

    cy.get('@updatedFund').then((fund: any) => {
      cy.contains(getFundName(fund)).should('be.visible');
    });
  });
});