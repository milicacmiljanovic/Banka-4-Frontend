type LoginResult = {
  user: Record<string, any>;
  token: string;
  refresh_token?: string;
};

type OtcContract = {
  otc_option_contract_id: number;
  seller_id: number;
  seller_full_name?: string;
  ticker: string;
  amount: number;
  settlement_date: string;
  status?: string;
  exercised_at?: string;
};

type PublicOtcListing = {
  ticker: string;
  owner_name: string;
  available_amount?: number;
  public_amount?: number;
};

export {};

const SELLER = {
  email: 'ana.anic@example.com',
  password: 'password123',
};

function apiUrl() {
  const value = Cypress.env('API_URL');
  if (!value) throw new Error('Missing Cypress env API_URL');
  return value;
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

function loginSeller() {
  return cy.request('POST', `${apiUrl()}/auth/login`, SELLER).then((response) => {
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

function isExpiredUnexercised(contract: OtcContract) {
  return !contract.exercised_at &&
    contract.status !== 'EXERCISED' &&
    (contract.status === 'EXPIRED' || new Date(contract.settlement_date).getTime() < Date.now());
}

describe('Scenario 22: Istekao ugovor oslobađa akcije za nove pregovore', () => {
  let sellerLogin: LoginResult;
  let expiredContract: OtcContract;
  let publicListing: PublicOtcListing;
  let availableAmount: number;

  beforeEach(() => {
    loginSeller().then((loginResult) => {
      sellerLogin = loginResult;
      const sellerId = sellerLogin.user.client_id ?? sellerLogin.user.id;

      cy.request({
        method: 'GET',
        url: `${tradingApiUrl()}/otc/contracts`,
        headers: authHeaders(sellerLogin.token),
      }).then((contractsResponse) => {
        expect(contractsResponse.status).to.eq(200);

        expiredContract = pickArray(contractsResponse.body).find((contract: OtcContract) =>
          Number(contract.seller_id) === Number(sellerId) && isExpiredUnexercised(contract)
        );

        expect(expiredContract, 'Prodavac mora imati bar jedan istekao i neiskorišćen OTC ugovor.').to.exist;
      });

      cy.request({
        method: 'GET',
        url: `${tradingApiUrl()}/otc/public`,
        headers: authHeaders(sellerLogin.token),
      }).then((publicResponse) => {
        expect(publicResponse.status).to.eq(200);

        publicListing = pickArray(publicResponse.body).find((listing: PublicOtcListing) => {
          const sameOwner = String(listing.owner_name ?? '').toLowerCase()
            .includes(`${sellerLogin.user.first_name} ${sellerLogin.user.last_name}`.toLowerCase());
          return sameOwner && listing.ticker === expiredContract.ticker;
        });

        expect(publicListing, 'Isti prodavac/ticker mora biti vidljiv u raspoloživim OTC akcijama.').to.exist;
        availableAmount = Number(publicListing.available_amount ?? publicListing.public_amount ?? 0);
        expect(availableAmount, 'Raspoloživa količina ne sme biti negativna.').to.be.at.least(0);
      });
    });
  });

  it('prikazuje istekli ugovor odvojeno i raspoloživu količinu za nove pregovore', () => {
    visitOtcAs(sellerLogin);

    cy.contains('button', 'Sklopljeni ugovori').click();
    cy.contains('button', 'Istekli ugovori').click();

    cy.contains('h2', 'Sklopljeni ugovori').should('be.visible');
    cy.contains('tr', expiredContract.ticker).within(() => {
      cy.contains(String(expiredContract.amount)).should('be.visible');
      cy.contains('button', 'Iskoristi').should('not.exist');
    });

    cy.contains('button', 'Dostupne akcije').click();
    cy.contains('h2', 'Dostupne akcije za ponudu').should('be.visible');

    cy.get('tbody tr').filter((_, row) => {
      const text = row.textContent ?? '';
      return text.includes(publicListing.owner_name) && text.includes(publicListing.ticker);
    }).first().within(() => {
      cy.get('td').eq(3).should('have.text', String(availableAmount));
    });
  });
});
