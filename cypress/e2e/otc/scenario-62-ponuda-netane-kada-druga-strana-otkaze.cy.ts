// nema nacin da se testira email preko UI-ja, ali mozemo da testiramo da li se ugovor ponovo pojavljuje u listi ponuda nakon sto druga strana otkaze ugovor

const AUTH_API = 'http://rafsi.davidovic.io:8080/api';
const BANKING_API = 'http://rafsi.davidovic.io:8081/api';
const TRADING_API = 'http://rafsi.davidovic.io:8082/api';

function pickArray(body: any) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

function loginOnly(email: string, password: string) {
  return cy.request('POST', `${AUTH_API}/auth/login`, { email, password });
}

function getClientId(user: any) {
  return user?.client_id ?? user?.clientId ?? user?.identity_id ?? user?.identityId ?? user?.id;
}

function getAccountNumber(account: any) {
  return String(
    account?.AccountNumber ??
    account?.account_number ??
    account?.accountNumber ??
    account?.number ??
    ''
  );
}

function getAccountCurrency(account: any) {
  return String(
    account?.CurrencyCode ??
    account?.currency_code ??
    account?.currencyCode ??
    account?.currency ??
    account?.Currency?.Code ??
    account?.Currency?.code ??
    ''
  ).toUpperCase();
}

function getTicker(item: any) {
  return String(item?.ticker ?? item?.Ticker ?? '').toUpperCase();
}

function getListingId(stock: any) {
  return stock?.listing_id ?? stock?.listingId ?? stock?.id;
}

function getOwnershipId(asset: any) {
  return (
    asset?.ownership_id ??
    asset?.asset_ownership_id ??
    asset?.ownershipId ??
    asset?.assetOwnershipId ??
    asset?.id
  );
}

function getOfferId(offer: any) {
  return offer?.offer_id ?? offer?.id ?? offer?.data?.offer_id ?? offer?.data?.id;
}

function fetchClientAccounts(token: string, clientId: string | number) {
  return cy.request({
    method: 'GET',
    url: `${BANKING_API}/clients/${clientId}/accounts`,
    headers: { Authorization: `Bearer ${token}` },
  });
}

function fetchStocks() {
  return cy.request({
    method: 'GET',
    url: `${TRADING_API}/listings/stocks?page=1&page_size=200&sort_by=price&sort_dir=asc`,
    failOnStatusCode: false,
  });
}

function fetchClientAssets(token: string, clientId: string | number) {
  return cy.request({
    method: 'GET',
    url: `${TRADING_API}/client/${clientId}/assets`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
}

function createOrder(token: string, payload: any) {
  return cy.request({
    method: 'POST',
    url: `${TRADING_API}/orders`,
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
    failOnStatusCode: false,
  });
}

function publishClientAsset(
  token: string,
  clientId: string | number,
  ownershipId: string | number,
  amount: number
) {
  return cy.request({
    method: 'PATCH',
    url: `${TRADING_API}/client/${clientId}/assets/${ownershipId}/publish`,
    headers: { Authorization: `Bearer ${token}` },
    body: { amount },
    failOnStatusCode: false,
  });
}

function createOtcOffer(token: string, payload: any) {
  return cy.request({
    method: 'POST',
    url: `${TRADING_API}/otc/offers`,
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
    failOnStatusCode: false,
  });
}

function fetchActiveOffers(token: string) {
  return cy.request({
    method: 'GET',
    url: `${TRADING_API}/otc/offers/active`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
}

function rejectOtcOffer(token: string, offerId: string | number, comment = 'Cypress cleanup/cancel') {
  return cy.request({
    method: 'PATCH',
    url: `${TRADING_API}/otc/offers/${offerId}/reject`,
    headers: { Authorization: `Bearer ${token}` },
    body: { comment },
    failOnStatusCode: false,
  });
}

describe('Scenario 62: Kada jedna strana odustane, ponuda nestaje iz aktivnih pregovora za obe strane', () => {
  const anaEmail = 'ana.anic@example.com';
  const anaPassword = 'password123';

  const markoEmail = 'marko@raf.rs';
  const markoPassword = 'pass123';

  let shouldRollbackSell = false;
  let anaTokenForRollback = '';
  let boughtListingIdForRollback: string | number | null = null;
  let anaAccountNumberForRollback = '';

  let shouldRollbackOffer = false;
  let rejectTokenForRollback = '';
  let offerIdForRollback: string | number | null = null;

  beforeEach(() => {
    shouldRollbackSell = false;
    anaTokenForRollback = '';
    boughtListingIdForRollback = null;
    anaAccountNumberForRollback = '';

    shouldRollbackOffer = false;
    rejectTokenForRollback = '';
    offerIdForRollback = null;
  });

  afterEach(() => {
    if (shouldRollbackOffer && rejectTokenForRollback && offerIdForRollback) {
      rejectOtcOffer(rejectTokenForRollback, offerIdForRollback).then((res) => {
        Cypress.log({
          name: 'rollback-reject-offer',
          message: `status=${res.status} body=${JSON.stringify(res.body)}`,
        });
      });
    }

    if (shouldRollbackSell && anaTokenForRollback && boughtListingIdForRollback && anaAccountNumberForRollback) {
      createOrder(anaTokenForRollback, {
        account_number: anaAccountNumberForRollback,
        direction: 'SELL',
        listing_id: boughtListingIdForRollback,
        order_type: 'MARKET',
        quantity: 1,
      }).then((res) => {
        Cypress.log({
          name: 'rollback-sell',
          message: `status=${res.status} body=${JSON.stringify(res.body)}`,
        });
      });
    }
  });

  it('ponuda se vidi kod oba korisnika i nestaje kada jedna strana odustane', () => {
    let anaToken = '';
    let anaClientId: string | number = '';
    let markoToken = '';
    let markoClientId: string | number = '';

    let selectedStock: any = null;
    let anaBuyAccount: any = null;
    let markoBuyerAccount: any = null;

    let boughtOwnershipId: string | number | null = null;
    let createdOfferId: string | number | null = null;

    const settlementDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    return loginOnly(anaEmail, anaPassword)
      .then((anaLoginRes) => {
        expect(anaLoginRes.status).to.eq(200);

        anaToken = anaLoginRes.body.token;
        anaClientId = getClientId(anaLoginRes.body.user);

        anaTokenForRollback = anaToken;

        expect(anaClientId, 'Ana mora imati client id').to.exist;

        return loginOnly(markoEmail, markoPassword);
      })
      .then((markoLoginRes) => {
        expect(markoLoginRes.status).to.eq(200);

        markoToken = markoLoginRes.body.token;
        markoClientId = getClientId(markoLoginRes.body.user);

        expect(markoClientId, 'Marko mora imati client id').to.exist;

        return cy.all?.([
          fetchClientAccounts(anaToken, anaClientId),
          fetchClientAccounts(markoToken, markoClientId),
          fetchStocks(),
        ]) ?? cy.wrap(null).then(() =>
          Cypress.Promise.all([
            fetchClientAccounts(anaToken, anaClientId),
            fetchClientAccounts(markoToken, markoClientId),
            fetchStocks(),
          ])
        );
      })
      .then((results: any) => {
        const [anaAccountsRes, markoAccountsRes, stocksRes] = results;

        expect(anaAccountsRes.status).to.eq(200);
        expect(markoAccountsRes.status).to.eq(200);
        expect(stocksRes.status).to.eq(200);

        const anaAccounts = pickArray(anaAccountsRes.body);
        const markoAccounts = pickArray(markoAccountsRes.body);
        const stocks = pickArray(stocksRes.body);

        expect(anaAccounts.length, 'Ana mora imati račune').to.be.greaterThan(0);
        expect(markoAccounts.length, 'Marko mora imati račune').to.be.greaterThan(0);
        expect(stocks.length, 'Mora postojati bar jedna akcija').to.be.greaterThan(0);

        const candidate = stocks.find((stock: any) => {
          const stockCurrency = String(stock?.currency ?? '').toUpperCase();
          if (!stockCurrency) return false;
          if (Number(stock?.price ?? 0) <= 0) return false;

          const anaAcc = anaAccounts.find((acc: any) => getAccountCurrency(acc) === stockCurrency);
          const markoAcc = markoAccounts.find((acc: any) => getAccountCurrency(acc) === stockCurrency);

          return !!anaAcc && !!markoAcc;
        });

        expect(candidate, 'Mora postojati akcija i račun iste valute kod oba korisnika').to.exist;

        selectedStock = candidate;

        const stockCurrency = String(candidate.currency ?? '').toUpperCase();
        anaBuyAccount = anaAccounts.find((acc: any) => getAccountCurrency(acc) === stockCurrency);
        markoBuyerAccount = markoAccounts.find((acc: any) => getAccountCurrency(acc) === stockCurrency);

        expect(anaBuyAccount, 'Ana mora imati račun za kupovinu').to.exist;
        expect(markoBuyerAccount, 'Marko mora imati račun za OTC ponudu').to.exist;

        anaAccountNumberForRollback = getAccountNumber(anaBuyAccount);
        expect(anaAccountNumberForRollback, 'Anin račun mora imati broj').to.not.equal('');

        return fetchClientAssets(anaToken, anaClientId);
      })
      .then((assetsBeforeRes) => {
        expect(assetsBeforeRes.status).to.eq(200);

        const assetsBefore = pickArray(assetsBeforeRes.body);
        const existingAsset = assetsBefore.find((asset: any) => getTicker(asset) === getTicker(selectedStock));
        const amountBefore = Number(existingAsset?.amount ?? 0);

        cy.wrap(amountBefore).as('amountBefore');

        return createOrder(anaToken, {
          account_number: anaAccountNumberForRollback,
          direction: 'BUY',
          listing_id: getListingId(selectedStock),
          order_type: 'MARKET',
          quantity: 1,
        });
      })
      .then((buyRes) => {
        expect(
          [200, 201],
          `BUY order nije uspeo: ${JSON.stringify(buyRes.body)}`
        ).to.include(buyRes.status);

        shouldRollbackSell = true;
        boughtListingIdForRollback = getListingId(selectedStock);

        function pollBoughtAsset(attempt = 0): Cypress.Chainable<any> {
          return cy.get('@amountBefore').then((amountBefore: any) => {
            return fetchClientAssets(anaToken, anaClientId).then((assetsRes) => {
              expect(assetsRes.status).to.eq(200);

              const assets = pickArray(assetsRes.body);
              const boughtAsset = assets.find((asset: any) => getTicker(asset) === getTicker(selectedStock));

              if (boughtAsset && Number(boughtAsset.amount ?? 0) >= Number(amountBefore) + 1) {
                return cy.wrap(boughtAsset);
              }

              if (attempt >= 10) {
                throw new Error(`Kupljena akcija se nije pojavila u Aninom portfoliju za ${getTicker(selectedStock)}.`);
              }

              return cy.wait(1500).then(() => pollBoughtAsset(attempt + 1));
            });
          });
        }

        return pollBoughtAsset();
      })
      .then((boughtAsset) => {
        boughtOwnershipId = getOwnershipId(boughtAsset);
        expect(boughtOwnershipId, 'Kupljena pozicija mora imati ownership id').to.exist;

        return publishClientAsset(anaToken, anaClientId, boughtOwnershipId as string | number, 1);
      })
      .then((publishRes) => {
        expect(
          [200, 204],
          `Publish nije uspeo: ${JSON.stringify(publishRes.body)}`
        ).to.include(publishRes.status);

        const offerPayload = {
          asset_ownership_id: boughtOwnershipId,
          amount: 1,
          price_per_stock_rsd: Number(selectedStock?.price ?? 0),
          settlement_date: settlementDate,
          premium_rsd: 10,
          buyer_account_number: getAccountNumber(markoBuyerAccount),
        };

        return createOtcOffer(markoToken, offerPayload);
      })
      .then((offerRes) => {
        expect(
          [200, 201],
          `Kreiranje OTC ponude nije uspelo: ${JSON.stringify(offerRes.body)}`
        ).to.include(offerRes.status);

        createdOfferId = getOfferId(offerRes.body);
        expect(createdOfferId, 'Kreirana OTC ponuda mora imati id').to.exist;

        offerIdForRollback = createdOfferId;
        rejectTokenForRollback = markoToken;
        shouldRollbackOffer = true;

        return fetchActiveOffers(markoToken);
      })
      .then((markoOffersRes) => {
        expect(markoOffersRes.status).to.eq(200);

        const markoOffers = pickArray(markoOffersRes.body);
        const markoOffer = markoOffers.find((offer: any) => String(getOfferId(offer)) === String(createdOfferId));

        expect(markoOffer, 'Marko mora videti aktivnu OTC ponudu').to.exist;

        return fetchActiveOffers(anaToken);
      })
      .then((anaOffersRes) => {
        expect(anaOffersRes.status).to.eq(200);

        const anaOffers = pickArray(anaOffersRes.body);
        const anaOffer = anaOffers.find((offer: any) => String(getOfferId(offer)) === String(createdOfferId));

        expect(anaOffer, 'Ana mora videti istu aktivnu OTC ponudu').to.exist;

        return rejectOtcOffer(markoToken, createdOfferId as string | number, 'Odustajem od pregovora');
      })
      .then((rejectRes) => {
        expect(
          [200, 204],
          `Reject OTC ponude nije uspeo: ${JSON.stringify(rejectRes.body)}`
        ).to.include(rejectRes.status);

        shouldRollbackOffer = false;

        function pollOfferGone(token: string, who: string, attempt = 0): Cypress.Chainable<any> {
          return fetchActiveOffers(token).then((offersRes) => {
            expect(offersRes.status).to.eq(200);

            const offers = pickArray(offersRes.body);
            const stillThere = offers.find((offer: any) => String(getOfferId(offer)) === String(createdOfferId));

            if (!stillThere) {
              return cy.wrap(null);
            }

            if (attempt >= 8) {
              throw new Error(`OTC ponuda i dalje postoji kod ${who} nakon reject.`);
            }

            return cy.wait(1000).then(() => pollOfferGone(token, who, attempt + 1));
          });
        }

        return pollOfferGone(markoToken, 'Marka');
      })
      .then(() => {
        return fetchActiveOffers(anaToken).then((anaOffersRes) => {
          expect(anaOffersRes.status).to.eq(200);

          const anaOffers = pickArray(anaOffersRes.body);
          const anaOffer = anaOffers.find((offer: any) => String(getOfferId(offer)) === String(createdOfferId));

          expect(anaOffer, 'Ponuda ne sme više da postoji kod Ane').to.not.exist;
        });
      });
  });
});

export {};