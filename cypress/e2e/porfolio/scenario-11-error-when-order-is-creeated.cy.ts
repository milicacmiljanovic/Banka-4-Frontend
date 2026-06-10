/// <reference types="cypress" />

import { MOCK_STOCK_ASSET } from '../../support/mockData';

const USER_SERVICE_URL    = Cypress.env('API_URL') as string;
const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

const NIKOLA_EMAIL    = Cypress.env('NIKOLA_EMAIL') as string;
const NIKOLA_PASSWORD = Cypress.env('NIKOLA_PASSWORD') as string;

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
      cy.intercept('GET', '**/actuary/*/assets', { body: [MOCK_STOCK_ASSET] });
    }

    cy.visit('/portfolio');

    cy.get('table tbody tr', { timeout: 20000 }).first().within(() => {
      cy.contains(/Sell|Prodaj/i).click({ force: true });
    });

    cy.contains('div', /Prodaj/i, { timeout: 20000 }).parents().eq(1).within(() => {
      cy.get('select').eq(1).should('be.visible').find('option').should('have.length.greaterThan', 1);
      cy.get('select').eq(1).select(1, { force: true });
      cy.get('input').filter(':visible').first().clear({ force: true }).type('100000', { force: true });
      cy.contains('button', /^Nastavi$/i).click({ force: true });
    });

    // Količina 100000 premašuje raspoloživo (10) — potvrda ne treba da se pojavi.
    cy.contains('button', /Potvrdi prodaju/i).should('not.exist');
  });
});

export {};
