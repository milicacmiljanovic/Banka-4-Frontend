type Fund = {
  name: string;
  description: string;
  totalValue: number;
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
    name: fund.name ?? fund.fund_name ?? fund.fundName ?? '—',
    description: fund.description ?? '—',
    totalValue:
      fund.totalValue ??
      fund.total_value ??
      fund.fund_value ??
      0,
  };
}

function getRenderedFundNames() {
  return cy.get('tbody tr').then(($rows) =>
    Cypress.$.makeArray($rows).map((row) => {
      const firstCell = row.querySelector('td');
      return firstCell?.textContent?.trim() ?? '';
    })
  );
}

describe('Scenario 30: Filtriranje i sortiranje fondova na discovery stranici', () => {
  beforeEach(() => {
    loginAsClientWithTradingPermission();
  });

  it('ažurira listu kada se filtrira po nazivu ili opisu fonda', () => {
    cy.get<Fund[]>('@expectedFunds').then((funds) => {
      expect(funds.length, 'Backend treba da vrati bar jedan investicioni fond.').to.be.greaterThan(0);

      const targetFund = funds.find((fund) => fund.name !== '—') ?? funds[0];
      const searchTerm = targetFund.name.split(/\s+/)[0] || targetFund.description.split(/\s+/)[0];
      const expectedNames = funds
        .filter((fund) => {
          const q = searchTerm.toLowerCase();
          return fund.name.toLowerCase().includes(q) || fund.description.toLowerCase().includes(q);
        })
        .map((fund) => fund.name);

      cy.get('input[placeholder*="Pretra"]').clear().type(searchTerm);
      cy.get('tbody tr', { timeout: 5000 }).should('have.length', expectedNames.length);

      expectedNames.forEach((name) => {
        cy.contains('tbody tr', name).should('be.visible');
      });
    });
  });

  it('ažurira redosled liste kada se sortira po ukupnoj vrednosti fonda', () => {
    cy.get<Fund[]>('@expectedFunds').then((funds) => {
      expect(funds.length, 'Backend treba da vrati bar jedan investicioni fond.').to.be.greaterThan(0);

      const expectedAscendingNames = [...funds]
        .sort((a, b) => a.totalValue - b.totalValue)
        .map((fund) => fund.name);

      cy.get('select').select('totalValue_asc');

      getRenderedFundNames().should((renderedNames) => {
        expect(renderedNames.slice(0, expectedAscendingNames.length)).to.deep.eq(expectedAscendingNames);
      });
    });
  });
});
