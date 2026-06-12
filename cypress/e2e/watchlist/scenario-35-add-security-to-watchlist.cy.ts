/// <reference types="cypress" />

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

const ANA_EMAIL    = 'ana.anic@example.com';
const ANA_PASSWORD = 'password123';

let authToken: string;
let watchlistId: number | null = null;
let testTicker: string;
let testListingId: number | null = null;
let addedListingId: number | null = null;

describe('Scenario 35: Dodavanje hartije na watchlist', () => {
  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: ANA_EMAIL,
      password: ANA_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;

      // Uzimamo prvu dostupnu akciju iz realnog backend-a
      cy.request({
        method: 'GET',
        url: `${TRADING_SERVICE_URL}/listings/stocks`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((stocksRes) => {
        const list: any[] = stocksRes.body?.data ?? stocksRes.body ?? [];
        expect(list.length, 'mora postojati bar jedna akcija u sistemu').to.be.greaterThan(0);
        testTicker    = list[0].ticker;
        testListingId = list[0].listing_id ?? list[0].id;
      });

      // Kreiramo test watchlist koji će biti dostupan u dropdown-u
      cy.request({
        method: 'POST',
        url: `${TRADING_SERVICE_URL}/watchlists`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { name: 'Test praćenje' },
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        watchlistId = res.body?.id ?? res.body?.watchlist_id ?? null;
        expect(watchlistId, 'watchlist ID mora biti kreiran').to.exist;
      });
    });
  });

  beforeEach(() => {
    addedListingId = null;
    cy.loginAsClientAna();
  });

  afterEach(() => {
    if (!watchlistId || !addedListingId) return;
    cy.request({
      method: 'DELETE',
      url: `${TRADING_SERVICE_URL}/watchlists/${watchlistId}/items/${addedListingId}`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    });
  });

  after(() => {
    if (!watchlistId) return;
    cy.request({
      method: 'DELETE',
      url: `${TRADING_SERVICE_URL}/watchlists/${watchlistId}`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    });
  });

  it('klik na zvezdicu dodaje hartiju na watchlist i prikazuje je u widget-u', () => {
    cy.intercept('POST', `**/watchlists/${watchlistId}/items`).as('addItem');

    cy.visit('/client/securities');

    // Čekamo da se tabela akcija učita
    cy.contains('tbody tr', testTicker, { timeout: 15000 }).should('be.visible');

    // WatchlistWidget (bookmark ikonica) čita isti store kao WatchlistButton dropdown.
    // Otvaramo panel i čekamo tab "Test praćenje" — tek kad je vidljiv, store je sigurno
    // popunjen i dropdown na zvezdici će prikazati label.
    cy.get('button[title="Liste praćenja"]').click();
    cy.contains('button', 'Test praćenje', { timeout: 15000 }).should('be.visible');
    cy.get('button[title="Liste praćenja"]').click(); // zatvaramo panel

    // Klik na zvezdicu (WatchlistButton) u redu sa testTicker
    cy.contains('tbody tr', testTicker).within(() => {
      cy.get('button[aria-label="Watchlist"]').click();
    });

    // Dropdown je portalan na body — store je potvrđeno popunjen, label sigurno postoji
    cy.contains('label', 'Test praćenje', { timeout: 8000 })
      .find('input[type="checkbox"]')
      .check({ force: true });

    cy.wait('@addItem').then((interception) => {
      expect(interception.response?.statusCode, 'dodavanje na watchlist mora biti 201').to.eq(201);
      addedListingId = interception.request.body?.listing_id ?? testListingId;
    });

    // Zvezdica postaje aktivna (isWatched = true → title se menja)
    cy.contains('tbody tr', testTicker).within(() => {
      cy.get('button[title="Upravljaj listama praćenja"]').should('exist');
    });

    // WatchlistWidget badge pokazuje da je hartija praćena
    cy.get('button[title="Liste praćenja"]').should('contain.text', '1');
  });
});
