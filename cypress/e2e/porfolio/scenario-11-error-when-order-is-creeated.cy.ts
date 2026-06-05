/// <reference types="cypress" />

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

const NIKOLA_EMAIL    = 'nikola@raf.rs';
const NIKOLA_PASSWORD = 'pass123';

const MOCK_ASSET = { ticker: 'AAPL', type: 'STOCK', amount: 10, pricePerUnitRSD: 800, profit: 50, ownership_id: 1, asset_ownership_id: 1, id: 1 };

let authToken   = '';
let hasRealData = false;
let actuaryId: number | null = null;

// POST /api/orders se ne šalje (Nastavi kliknut, Potvrdi ne) — baza se ne menja, nema cleanup-a.
describe('SAGA Pattern - Scenario 11: Error when order is created', () => {
  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: NIKOLA_EMAIL,
      password: NIKOLA_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
      const user = res.body.user ?? res.body;
      actuaryId = user?.employee_id ?? user?.actuary_id ?? user?.identity_id ?? user?.id ?? null;
      if (!actuaryId) return;
      cy.request({
        method: 'GET',
        url: `${TRADING_SERVICE_URL}/actuary/${actuaryId}/assets`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((portfolioRes) => {
        const assets: any[] = portfolioRes.body?.data ?? portfolioRes.body ?? [];
        hasRealData = assets.filter((a: any) => a.type?.toUpperCase() !== 'OPTION').length > 0;
      });
    });
  });

  beforeEach(() => {
    cy.loginAsNikola();
  });

  it('pokuša prodaju sa previše velikom količinom; UI prikazuje grešku pre potvrde', () => {
    if (!hasRealData) {
      cy.intercept('GET', '**/actuary/*/assets', { body: [MOCK_ASSET] });
    }

    cy.visit('http://localhost:5173/portfolio');

    cy.get('table tbody tr', { timeout: 20000 }).first().within(() => {
      cy.contains(/Sell|Prodaj/i).click({ force: true });
    });

    cy.contains('div', /Prodaj/i, { timeout: 20000 }).parents().eq(1).within(() => {
      cy.get('select').eq(1).should('be.visible').find('option').should('have.length.greaterThan', 1);
      cy.get('select').eq(1).select(1, { force: true });
      cy.get('input').filter(':visible').first().clear({ force: true }).type('100000', { force: true });
      cy.contains('button', /^Nastavi$/i).click({ force: true });
    });
  });
});

export {};
