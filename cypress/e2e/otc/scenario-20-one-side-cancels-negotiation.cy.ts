type TestUser = {
  name: string;
  email: string;
  password: string;
};

type LoginResult = {
  user: Record<string, any>;
  token: string;
  refresh_token?: string;
};

type OtcOffer = {
  otc_offer_id: number;
  ticker?: string;
  stock_name?: string;
};

export {};

const BUYER: TestUser = {
  name: 'marko',
  email: 'marko.markovic@example.com',
  password: 'password123',
};

const SELLER: TestUser = {
  name: 'ana',
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

function bankingApiUrl() {
  return Cypress.env('BANKING_API_URL') ?? 'http://rafsi.davidovic.io:8081/api';
}

function pickArray(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  return [];
}

function login(user: TestUser) {
  return cy.request('POST', `${apiUrl()}/auth/login`, {
    email: user.email,
    password: user.password,
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body as LoginResult;
  });
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function activeOffers(token: string) {
  return cy
    .request({
      method: 'GET',
      url: `${tradingApiUrl()}/otc/offers/active`,
      headers: authHeaders(token),
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return pickArray(response.body) as OtcOffer[];
    });
}

function createActiveOfferBetweenMarkoAndAna(buyerLogin: LoginResult) {
  const buyerId = buyerLogin.user.client_id ?? buyerLogin.user.id;

  return cy
    .request({
      method: 'GET',
      url: `${tradingApiUrl()}/otc/public`,
      headers: authHeaders(buyerLogin.token),
    })
    .then((publicResponse) => {
      expect(publicResponse.status).to.eq(200);

      const anaListing = pickArray(publicResponse.body).find((listing) => {
        const owner = String(listing.owner_name ?? '').toLowerCase();
        return owner.includes('ana') && Number(listing.available_amount ?? listing.public_amount ?? 0) >= 1;
      });

      expect(anaListing, 'Ana mora imati javno dostupnu OTC akciju.').to.exist;

      return cy
        .request({
          method: 'GET',
          url: `${bankingApiUrl()}/clients/${buyerId}/accounts`,
          headers: authHeaders(buyerLogin.token),
        })
        .then((accountsResponse) => {
          expect(accountsResponse.status).to.eq(200);

          const buyerAccount = pickArray(accountsResponse.body)[0];
          expect(buyerAccount?.account_number, 'Marko mora imati aktivan račun za OTC ponudu.').to.exist;

          return cy
            .request({
              method: 'POST',
              url: `${tradingApiUrl()}/otc/offers`,
              headers: authHeaders(buyerLogin.token),
              body: {
                asset_ownership_id: anaListing.asset_ownership_id,
                amount: 1,
                price_per_stock_rsd: 100,
                settlement_date: '2026-06-30T00:00:00Z',
                premium_rsd: 1,
                buyer_account_number: buyerAccount.account_number,
              },
            })
            .then((createResponse) => {
              expect(createResponse.status).to.be.oneOf([200, 201]);
              return createResponse.body as OtcOffer;
            });
        });
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

function openActiveOffersTab() {
  cy.contains('button', /^Aktivne ponude$/).click();
  cy.contains('h2', 'Aktivne ponude').should('be.visible');
}

function assertOfferNotVisibleInActiveOffers(offerId: number) {
  openActiveOffersTab();
  cy.contains(`Ponuda #${offerId}`).should('not.exist');
  cy.contains(`td`, `#${offerId}`).should('not.exist');
}

describe('Scenario 20: Jedna strana odustaje od pregovora', () => {
  let buyerLogin: LoginResult;
  let sellerLogin: LoginResult;
  let offer: OtcOffer | null;

  before(() => {
    // Pribavljamo tokene direktno, bez UI — koristimo ih za setup, cleanup i API verifikaciju
    login(BUYER).then((result) => {
      buyerLogin = result;
    });
    login(SELLER).then((result) => {
      sellerLogin = result;
    });
  });

  beforeEach(() => {
    offer = null;
    // Setup: uvek kreiramo novu ponudu da svaki test počne iz poznatog stanja
    createActiveOfferBetweenMarkoAndAna(buyerLogin).then((createdOffer) => {
      offer = createdOffer;
    });
  });

  afterEach(() => {
    if (!offer) return;
    // Cleanup: odbijamo ponudu ako test nije završio otkazivanje
    // Ako je test prošao i već otkazao ponudu, ovaj poziv dobija 4xx — failOnStatusCode: false ga ignoriše
    cy.request({
      method: 'PATCH',
      url: `${tradingApiUrl()}/otc/offers/${offer.otc_offer_id}/reject`,
      headers: authHeaders(buyerLogin.token),
      body: {},
      failOnStatusCode: false,
    });
  });

  it('briše ponudu kupcu i prodavcu kada jedna strana klikne na Odustani', () => {
    visitOtcAs(buyerLogin);
    openActiveOffersTab();

    cy.contains('tr', `#${offer!.otc_offer_id}`).within(() => {
      cy.contains('button', 'Detalji').click();
    });

    cy.contains('h3', `Ponuda #${offer!.otc_offer_id}`).should('be.visible');
    cy.contains('button', /^Odustani$/).click();
    cy.contains('Pregovor je uspešno otkazan.').should('be.visible');

    activeOffers(buyerLogin.token).then((offers) => {
      expect(offers.map((item) => item.otc_offer_id)).not.to.include(offer!.otc_offer_id);
    });

    activeOffers(sellerLogin.token).then((offers) => {
      expect(offers.map((item) => item.otc_offer_id)).not.to.include(offer!.otc_offer_id);
    });

    assertOfferNotVisibleInActiveOffers(offer!.otc_offer_id);

    visitOtcAs(sellerLogin);
    assertOfferNotVisibleInActiveOffers(offer!.otc_offer_id);
  });
});
