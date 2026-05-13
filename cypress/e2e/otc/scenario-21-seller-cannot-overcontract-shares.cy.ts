type LoginResult = {
  user: Record<string, any>;
  token: string;
  refresh_token?: string;
};

type PublicOtcListing = {
  asset_ownership_id: number;
  ticker: string;
  name: string;
  owner_name: string;
  available_amount?: number;
  public_amount?: number;
};

export {};

const BUYER = {
  email: 'marko.markovic@example.com',
  password: 'password123',
};

function apiUrl() {
  const value = Cypress.env('API_URL');
  if (!value) throw new Error('Missing Cypress env API_URL');
  return value;
}

function bankingApiUrl() {
  return Cypress.env('BANKING_API_URL') ?? 'http://rafsi.davidovic.io:8081/api';
}

function tradingApiUrl() {
  return Cypress.env('TRADING_API_URL') ?? 'http://rafsi.davidovic.io:8082/api';
}

function pickArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  return [];
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function loginBuyer() {
  return cy.request('POST', `${apiUrl()}/auth/login`, BUYER).then((response) => {
    expect(response.status).to.eq(200);
    return response.body as LoginResult;
  });
}

function visitOtcAs(loginResult: LoginResult) {
  cy.visit('/otc', {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', loginResult.token);
      if (loginResult.refresh_token) win.localStorage.setItem('refreshToken', loginResult.refresh_token);
      else win.localStorage.removeItem('refreshToken');
      win.localStorage.setItem('user', JSON.stringify(loginResult.user));
    },
  });
}

describe('Scenario 21: Prodavac ne može imati ugovore za više akcija nego što poseduje', () => {
  let buyerLogin: LoginResult;
  let listing: PublicOtcListing;
  let buyerAccountNumber: string;
  let offerAmount: number;

  beforeEach(() => {
    loginBuyer().then((loginResult) => {
      buyerLogin = loginResult;
      const buyerId = buyerLogin.user.client_id ?? buyerLogin.user.id;

      cy.request({
        method: 'GET',
        url: `${tradingApiUrl()}/otc/public`,
        headers: authHeaders(buyerLogin.token),
      }).then((publicResponse) => {
        expect(publicResponse.status).to.eq(200);

        listing = pickArray(publicResponse.body).find((item) =>
          Number(item.available_amount ?? item.public_amount ?? 0) > 0 &&
          String(item.owner_name ?? '').toLowerCase().includes('ana')
        );

        expect(listing, 'Ana mora imati OTC akciju sa raspoloživom količinom.').to.exist;
        offerAmount = Number(listing.available_amount ?? listing.public_amount) + 1;
      });

      cy.request({
        method: 'GET',
        url: `${bankingApiUrl()}/clients/${buyerId}/accounts`,
        headers: authHeaders(buyerLogin.token),
      }).then((accountsResponse) => {
        expect(accountsResponse.status).to.eq(200);

        const account = pickArray(accountsResponse.body)[0];
        expect(account?.account_number, 'Kupac mora imati račun za slanje OTC ponude.').to.exist;
        buyerAccountNumber = account.account_number;
      });
    });
  });

  it('odbija ponudu čija količina prelazi raspoložive akcije prodavca i prikazuje poruku', () => {
    visitOtcAs(buyerLogin);

    cy.contains('h2', 'Dostupne akcije za ponudu').should('be.visible');
    cy.get('tbody tr').filter((_, row) => {
      const text = row.textContent ?? '';
      return text.includes(listing.owner_name) && text.includes(listing.ticker);
    }).first().within(() => {
      cy.contains(listing.ticker).should('be.visible');
      cy.contains('button', 'Pošalji ponudu').click();
    });

    cy.contains('h2', 'Make an Offer').should('be.visible');
    cy.contains('label', 'Volume of a stock').find('input').clear().type(String(offerAmount));
    cy.contains('label', 'Price Offer').find('input').clear().type('100');
    cy.contains('label', 'Settlement Date Offer').find('input').clear().type('2027-06-30');
    cy.contains('label', 'Premium Offer').find('input').clear().type('1');
    cy.contains('label', 'Račun za plaćanje').find('select').select(buyerAccountNumber);
    cy.contains('button', 'Make an Offer').click();

    cy.contains(/does not have enough public shares|not enough public shares|insufficient|nedovoljn|raspoloživ/i)
      .should('be.visible');
  });
});
