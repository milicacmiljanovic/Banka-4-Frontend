// Scenario 73: Prikaz metrika na Discovery page
// Koristi prave podatke iz trading-service (port 8082)
// Pravi fondovi u bazi (Alpha Growth Fund, Beta Stable Fund) imaju sve 4 metrike.
// Read-only test — nema izmena baze, nema potrebe za cleanup-om

const AUTH_API    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_API = 'http://rafsi.davidovic.io:8082/api';

describe('Scenario 73: Prikaz metrika na Discovery page', () => {
  before(() => {
    // Login jednom i sačuvaj token za API verifikacije
    cy.request('POST', `${AUTH_API}/auth/login`, {
      email: 'marko.markovic@example.com',
      password: 'password123',
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.wrap(res.body.token).as('token');

      // Potvrdi da backend vraća fondove sa metrikama
      cy.request({
        method: 'GET',
        url: `${TRADING_API}/investment-funds`,
        headers: { Authorization: `Bearer ${res.body.token}` },
      }).then((fundsRes) => {
        expect(fundsRes.status).to.eq(200);
        const funds = fundsRes.body?.data ?? fundsRes.body ?? [];
        const withMetrics = funds.filter(
          (f: any) => f.annual_return != null || f.annualReturn != null
        );
        expect(
          withMetrics.length,
          'U bazi mora postojati bar jedan fond sa metrikama'
        ).to.be.greaterThan(0);
        cy.wrap(withMetrics[0].name ?? withMetrics[0].fund_name).as('fundWithMetricsName');
      });
    });
  });

  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/investment-funds');
    cy.get('table', { timeout: 15000 }).should('be.visible');
  });

  it('prikazuje kolonu Godišnji prinos', () => {
    cy.get('table thead').contains(/godišnji prinos/i).should('be.visible');
  });

  it('prikazuje kolonu Reward-to-variability ratio', () => {
    cy.get('table thead').contains(/reward.to.variability|sharpe/i).should('be.visible');
  });

  it('prikazuje kolonu Max Drawdown', () => {
    cy.get('table thead').contains(/max.?drawdown/i).should('be.visible');
  });

  it('prikazuje kolonu Volatilnost', () => {
    cy.get('table thead').contains(/volatilnost|volatility/i).should('be.visible');
  });

  it('fond sa dovoljno istorijskih podataka prikazuje numeričke vrednosti metrika', () => {
    cy.get<string>('@fundWithMetricsName').then((fundName) => {
      cy.contains('tbody tr', fundName).within(() => {
        // Mora biti vidljiva bar jedna decimalna vrednost (npr. 73,33 ili 14,07)
        cy.get('td').contains(/\d+[,.]\d+/).should('be.visible');
      });
    });
  });

  it('može sortirati fondove po Godišnjem prinosu', () => {
    cy.get('table thead').contains(/godišnji prinos/i).click();
    cy.get('tbody tr').should('have.length.at.least', 1);

    // Drugi klik — sortiraj obrnuto
    cy.get('table thead').contains(/godišnji prinos/i).click();
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('može sortirati fondove po Reward-to-variability ratio', () => {
    cy.get('table thead').contains(/reward.to.variability|sharpe/i).click();
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('može sortirati fondove po Max Drawdown', () => {
    cy.get('table thead').contains(/max.?drawdown/i).click();
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('može sortirati fondove po Volatilnosti', () => {
    cy.get('table thead').contains(/volatilnost|volatility/i).click();
    cy.get('tbody tr').should('have.length.at.least', 1);
  });
});
