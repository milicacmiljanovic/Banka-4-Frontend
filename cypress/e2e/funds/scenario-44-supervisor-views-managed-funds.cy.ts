import { pickArray } from '../../support/helpers';

function loginAsSupervisor() {
  const apiUrl = Cypress.env('API_URL');
  if (!apiUrl) throw new Error('Missing Cypress env API_URL');

  cy.request('POST', `${apiUrl}/auth/login`, {
    email: 'admin@raf.rs',
    password: 'admin123',
  }).then((res) => {
    expect(res.status).to.eq(200);

    const { user, token, refresh_token } = res.body;

    cy.visit('/portfolio', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
        if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
        else win.localStorage.removeItem('refreshToken');
        win.localStorage.setItem('user', JSON.stringify(user));
      },
    });
  });
}

describe('Scenario 44: Supervizor pregleda fondove kojima upravlja', () => {
  beforeEach(() => {
    loginAsSupervisor();

    cy.intercept('GET', '**/api/actuary/*/assets/funds*').as('getManagedFunds');
    cy.intercept('GET', '**/api/**/assets*').as('getPortfolioAssets');
  });

  it('na tabu "Moji fondovi" vidi fondove koje upravlja sa nazivom, opisom, vrednošću i likvidnošću', () => {
    cy.wait('@getPortfolioAssets');

    cy.contains(/^Moji fondovi$/i).click();

    cy.wait('@getManagedFunds').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const funds = pickArray(response?.body);
      expect(funds.length, 'Supervizor treba da ima bar jedan fond kojim upravlja.').to.be.greaterThan(0);

      const fund = funds[0];
      expect(fund.fund_id ?? fund.id).to.exist;
      expect(fund.name ?? fund.fund_name).to.exist;
    });

    cy.contains(/^Moji fondovi$/i).should('be.visible');

    cy.get('@getManagedFunds').then((interception: any) => {
      const funds = pickArray(interception.response?.body);
      const firstFund = funds[0];

      const fundName = firstFund.name ?? firstFund.fund_name;
      const fundDescription = firstFund.description ?? firstFund.fund_description;
      const fundValue = Number(firstFund.fund_value ?? 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const fundLiquidity = Number(
        firstFund.liquid_assets ??
        firstFund.available_liquidity_rsd ??
        firstFund.liquidity_rsd ??
        0
      ).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      cy.contains(fundName).should('be.visible');

      if (fundDescription) {
        cy.contains(fundDescription).should('be.visible');
      }

      cy.contains(/vrednost fonda/i).should('be.visible');
      cy.contains(fundValue.replace(/\s/g, '\\s*'), { matchCase: false }).should('exist');

      cy.contains(/likvidnost/i).should('be.visible');
      cy.contains(fundLiquidity.replace(/\s/g, '\\s*'), { matchCase: false }).should('exist');
    });
  });
});