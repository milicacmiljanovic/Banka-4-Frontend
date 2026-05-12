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

describe('Scenario 41: Supervizor kupuje hartiju za banku', () => {
  beforeEach(() => {
    loginAsSupervisor();

    cy.intercept('GET', '**/api/listings/stocks*').as('getStocks');
    cy.intercept('GET', '**/api/accounts*').as('getAccounts');
    cy.intercept('POST', '**/api/orders').as('createBankOrder');
    cy.intercept('POST', '**/api/orders/invest').as('createFundOrder');
  });

  it('šalje BUY order sa bankinog računa preko običnog /orders endpointa', () => {
    cy.wait('@getStocks').then(({ response }) => {
      expect(response?.statusCode).to.eq(200);

      const stocks = pickArray(response?.body);
      expect(stocks.length).to.be.greaterThan(0);

      const cheapest = [...stocks]
        .filter((s: any) => Number(s?.price) > 0)
        .sort((a: any, b: any) => Number(a.price) - Number(b.price))[0];

      expect(cheapest).to.exist;
      cy.wrap(cheapest).as('targetStock');
    });

    cy.get('@targetStock').then((stock: any) => {
      cy.contains('td', stock.ticker)
        .closest('tr')
        .within(() => {
          cy.contains(/kreiraj nalog/i).click();
        });
    });

    cy.contains(/^KUPUJEM ZA BANKU$/i).click();

    cy.wait('@getAccounts').its('response.statusCode').should('eq', 200);

    selectFirstRealAccountOption();

    cy.get('input[placeholder="Unesite količinu..."]').clear().type('1');

    cy.contains('button', /^Nastavi$/i)
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.contains('button', /^Potvrdi$/i)
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@createBankOrder').then(({ request, response }) => {
      expect([200, 201]).to.include(response?.statusCode);
      expect(request.body.direction).to.eq('BUY');
      expect(request.body.quantity).to.eq(1);
      expect(request.body.account_number).to.exist;
      expect(request.body.listing_id).to.exist;
      expect(request.body.fund_id).to.not.exist;
    });

    cy.get('@createFundOrder.all').should('have.length', 0);
  });
});