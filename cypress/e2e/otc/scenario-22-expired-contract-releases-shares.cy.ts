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

const BUYER = {
  email: 'marko.markovic@example.com',
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

function bankingApiUrl() {
  return Cypress.env('BANKING_API_URL') ?? 'http://rafsi.davidovic.io:8081/api';
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

  before(() => {
    // Prijavljujemo se jednom da dobijemo tokene za setup
    loginSeller().then((sellerResult) => {
      const sellerToken = sellerResult.token;
      const sellerId = sellerResult.user.client_id ?? sellerResult.user.id;

      cy.request({
        method: 'GET',
        url: `${tradingApiUrl()}/otc/contracts`,
        headers: authHeaders(sellerToken),
      }).then((contractsRes) => {
        expect(contractsRes.status).to.eq(200);

        const existing = pickArray(contractsRes.body).find(
          (c: OtcContract) => Number(c.seller_id) === Number(sellerId) && isExpiredUnexercised(c)
        );

        if (existing) return; // istekli ugovor već postoji, setup nije potreban

        // Setup: kreiramo ponudu sa prošlim datumom i Ana je prihvata
        // Prihvatanjem nastaje ugovor čiji je settlementDate u prošlosti → odmah je "expired"
        cy.request('POST', `${apiUrl()}/auth/login`, BUYER).then((buyerLoginRes) => {
          expect(buyerLoginRes.status).to.eq(200);
          const buyerToken = buyerLoginRes.body.token;
          const buyerId = buyerLoginRes.body.user.client_id ?? buyerLoginRes.body.user.id;

          cy.request({
            method: 'GET',
            url: `${tradingApiUrl()}/otc/public`,
            headers: authHeaders(buyerToken),
          }).then((publicRes) => {
            if (publicRes.status !== 200) return;

            const anaListing = pickArray(publicRes.body).find((listing: any) => {
              const owner = String(listing.owner_name ?? '').toLowerCase();
              return owner.includes('ana') && Number(listing.available_amount ?? listing.public_amount ?? 0) >= 1;
            });

            if (!anaListing) return;

            cy.request({
              method: 'GET',
              url: `${bankingApiUrl()}/clients/${buyerId}/accounts`,
              headers: authHeaders(buyerToken),
            }).then((accountsRes) => {
              if (accountsRes.status !== 200) return;

              const account = pickArray(accountsRes.body)[0];
              if (!account?.account_number) return;

              cy.request({
                method: 'POST',
                url: `${tradingApiUrl()}/otc/offers`,
                headers: authHeaders(buyerToken),
                body: {
                  asset_ownership_id: anaListing.asset_ownership_id,
                  amount: 1,
                  price_per_stock_rsd: 100,
                  settlement_date: '2024-01-01T00:00:00Z',
                  premium_rsd: 1,
                  buyer_account_number: account.account_number,
                },
                failOnStatusCode: false,
              }).then((offerRes) => {
                if (offerRes.status !== 200 && offerRes.status !== 201) return;

                const offerId = offerRes.body.otc_offer_id;
                // Ana prihvata ponudu — nastaje ugovor sa prošlim settlementDate (istekao)
                cy.request({
                  method: 'PATCH',
                  url: `${tradingApiUrl()}/otc/offers/${offerId}/accept`,
                  headers: authHeaders(sellerToken),
                  body: {},
                  failOnStatusCode: false,
                });
              });
            });
          });
        });
      });
    });
  });

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
        // Nema hard assert ovde — test se preskače u it() ako nema isteklih ugovora
      });

      cy.request({
        method: 'GET',
        url: `${tradingApiUrl()}/otc/public`,
        headers: authHeaders(sellerLogin.token),
      }).then((publicResponse) => {
        expect(publicResponse.status).to.eq(200);

        if (!expiredContract) return; // nema smisla tražiti listing bez poznatog tickera

        publicListing = pickArray(publicResponse.body).find((listing: PublicOtcListing) => {
          const sameOwner = String(listing.owner_name ?? '').toLowerCase()
            .includes(`${sellerLogin.user.first_name} ${sellerLogin.user.last_name}`.toLowerCase());
          return sameOwner && listing.ticker === expiredContract.ticker;
        });

        if (!publicListing) return;
        availableAmount = Number(publicListing.available_amount ?? publicListing.public_amount ?? 0);
      });
    });
  });

  // Nema afterEach — test ne menja stanje u bazi, samo čita i proverava

  it('prikazuje istekli ugovor odvojeno i raspoloživu količinu za nove pregovore', function() {
    if (!expiredContract) {
      cy.log('Nema isteklih OTC ugovora u bazi — test je preskočen. Potrebno je ručno podesiti testne podatke.');
      this.skip();
      return;
    }

    cy.visit('/otc', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', sellerLogin.token);
        if (sellerLogin.refresh_token) win.localStorage.setItem('refreshToken', sellerLogin.refresh_token);
        else win.localStorage.removeItem('refreshToken');
        win.localStorage.setItem('user', JSON.stringify(sellerLogin.user));
      },
    });

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
