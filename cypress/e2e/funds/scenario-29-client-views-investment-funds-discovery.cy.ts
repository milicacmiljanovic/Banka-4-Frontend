type Fund = {
  id?: number | string;
  name: string;
  description: string;
  totalValue: number;
  profit: number;
  minimumInvestment: number;
};

export {};

function loginAsClientWithTradingPermission(targetPath = '/investment-funds') {
  const apiUrl = Cypress.env('API_URL');
  const tradingApiUrl = Cypress.env('TRADING_API_URL') ?? 'http://rafsi.davidovic.io:8082/api';
  if (!apiUrl) throw new Error('Missing Cypress env API_URL');

  cy.request('POST', `${apiUrl}/auth/login`, {
    email: 'marko.markovic@example.com',
    password: 'password123',
  }).then((res) => {
    expect(res.status).to.eq(200);

    const { user, token, refresh_token } = res.body;
    const clientWithTradingPermission = {
      ...user,
      identity_type: 'client',
      permissions: Array.from(new Set([...(user.permissions ?? []), 'trade'])),
    };

    cy.request({
      method: 'GET',
      url: `${tradingApiUrl}/investment-funds`,
      headers: { Authorization: `Bearer ${token}` },
    }).then((fundsRes) => {
      expect(fundsRes.status).to.eq(200);
      cy.wrap(pickArray(fundsRes.body).map(normalizeFund)).as('expectedFunds');

      cy.visit(targetPath, {
        onBeforeLoad(win) {
          win.sessionStorage.clear();
          win.localStorage.setItem('token', token);
          if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
          else win.localStorage.removeItem('refreshToken');
          win.localStorage.setItem('user', JSON.stringify(clientWithTradingPermission));
        },
      });
    });
  });
}

function pickArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.funds)) return body.funds;
  if (Array.isArray(body?.content)) return body.content;
  return [];
}

function normalizeFund(fund: any): Fund {
  return {
    id: fund.id ?? fund.fund_id ?? fund.fundId,
    name: fund.name ?? fund.fund_name ?? fund.fundName ?? '—',
    description: fund.description ?? '—',
    totalValue:
      fund.totalValue ??
      fund.total_value ??
      fund.fund_value ??
      0,
    profit: fund.profit ?? 0,
    minimumInvestment:
      fund.minimum_contribution ?? 0,
  };
}

function formatRsd(value: number) {
  return Number(value).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapedFlexibleWhitespace(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s/g, '\\s*');
}

describe('Scenario 29: Klijent vidi listu investicionih fondova na discovery stranici', () => {
  beforeEach(() => {
    loginAsClientWithTradingPermission();
  });

  it('prikazuje tabelu svih dostupnih fondova sa nazivom, opisom, vrednošću, profitom i minimalnim ulogom', () => {
    cy.get<Fund[]>('@expectedFunds').then((funds) => {
      expect(funds.length, 'Backend treba da vrati bar jedan investicioni fond.').to.be.greaterThan(0);

      cy.contains('h1', 'Investicioni fondovi').should('be.visible');
      cy.get('table').should('be.visible');
      cy.contains('th', 'Naziv').should('be.visible');
      cy.contains('th', 'Opis').should('be.visible');
      cy.contains('th', 'Ukupna vrednost').should('be.visible');
      cy.contains('th', 'Profit').should('be.visible');
      cy.contains('th', 'Minimalni ulog').should('be.visible');
      cy.get('tbody tr').should('have.length.at.least', funds.length);

      funds.forEach((fund) => {
        cy.contains('tbody tr', fund.name).within(() => {
          cy.contains(fund.name).should('be.visible');
          cy.contains(fund.description).should('be.visible');
          cy.contains(new RegExp(escapedFlexibleWhitespace(formatRsd(fund.totalValue)))).should('be.visible');
          cy.contains(new RegExp(escapedFlexibleWhitespace(formatRsd(fund.profit)))).should('be.visible');
          cy.contains(new RegExp(escapedFlexibleWhitespace(formatRsd(fund.minimumInvestment)))).should('be.visible');
        });
      });
    });
  });
});
