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

    cy.visit('/securities', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', token);
        if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
        else win.localStorage.removeItem('refreshToken');
        win.localStorage.setItem('user', JSON.stringify(user));
      },
    });
  });
}

function selectFirstRealAccountOption() {
  cy.contains(/^RAČUN ZA KUPOVINU$/i)
    .parent()
    .find('select')
    .should('not.be.disabled');

  cy.wait(500);

  cy.contains(/^RAČUN ZA KUPOVINU$/i)
    .parent()
    .find('select option')
    .then(($options) => {
      const real = [...$options].find((o) => {
        const opt = o as HTMLOptionElement;
        const text = (opt.textContent || '').trim();
        return opt.value && text !== 'Učitavanje...' && text !== 'Izaberite račun...';
      });

      expect(real, 'Mora postojati bar jedan stvarni račun u dropdown-u.').to.exist;

      cy.contains(/^RAČUN ZA KUPOVINU$/i)
        .parent()
        .find('select')
        .select((real as HTMLOptionElement).value, { force: true })
        .blur();
    });
}

describe('Scenario 42: Supervizor ne može kupiti za fond ako nema dovoljno likvidnosti', () => {
  beforeEach(() => {
    loginAsSupervisor();

    cy.intercept('GET', '**/api/listings/stocks*').as('getStocks');
    cy.intercept('GET', '**/api/accounts*').as('getAccounts');
    cy.intercept('GET', '**/api/actuary/*/assets/funds*').as('getManagedFunds');
    cy.intercept('POST', '**/api/orders/invest').as('createFundOrder');
  });

  it('blokira nastavak i prikazuje poruku o nedovoljnoj likvidnosti fonda', () => {
    cy.wait('@getStocks').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const stocks = pickArray(response?.body);
      expect(stocks.length).to.be.greaterThan(0);

      const expensive = [...stocks]
        .filter((s: any) => Number(s?.price) > 0)
        .sort((a: any, b: any) => Number(b.price) - Number(a.price))[0];

      expect(expensive).to.exist;
      cy.wrap(expensive).as('targetStock');
    });

    cy.get('@targetStock').then((stock: any) => {
      cy.contains('td', stock.ticker)
        .closest('tr')
        .within(() => {
          cy.contains(/kreiraj nalog/i).click();
        });
    });

    cy.contains(/^KUPUJEM ZA INVESTICIONI FOND$/i).click();

    cy.wait('@getAccounts').its('response.statusCode').should('eq', 200);
    cy.wait('@getManagedFunds').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const funds = pickArray(response?.body);

      const fund = funds
        .map((f: any) => ({
          ...f,
          liquidity: Number(
            f.liquid_assets ??
            f.available_liquidity_rsd ??
            f.liquidity_rsd ??
            0
          ),
        }))
        .filter((f: any) => f.liquidity > 0)
        .sort((a: any, b: any) => a.liquidity - b.liquidity)[0];

      expect(fund, 'Potreban je bar jedan fond sa pozitivnom likvidnošću.').to.exist;
      cy.wrap(fund).as('targetFund');
    });

    selectFirstRealAccountOption();

    cy.contains(/^INVESTICIONI FOND$/i)
      .parent()
      .find('select')
      .should('not.be.disabled');

    cy.wait(500);

    cy.get('@targetFund').then((fund: any) => {
      const fundId = String(fund.fund_id ?? fund.id);

      cy.contains(/^INVESTICIONI FOND$/i)
        .parent()
        .find('select')
        .select(fundId, { force: true })
        .blur();

      cy.get('@targetStock').then((stock: any) => {
        const qty = Math.floor(fund.liquidity / Number(stock.price)) + 1;
        expect(qty).to.be.greaterThan(0);

        cy.get('input[placeholder="Unesite količinu..."]').clear().type(String(qty));
      });
    });

    cy.contains('button', /^Nastavi$/i)
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.contains(/Fond nema dovoljno raspoložive likvidnosti/i).should('be.visible');
    cy.contains('button', /^Potvrdi$/i).should('not.exist');
    cy.get('@createFundOrder.all').should('have.length', 0);
  });
});