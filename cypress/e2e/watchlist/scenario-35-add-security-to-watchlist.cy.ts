/// <reference types="cypress" />

export {};

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

      // Čistimo eventualni ostatak iz prethodnog run-a
      cy.request({
        method: 'GET',
        url: `${TRADING_SERVICE_URL}/watchlists`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false,
      }).then((wRes) => {
        const lists: any[] = wRes.body?.data ?? wRes.body ?? [];
        const existing = lists.find((w: any) => w.name === 'Test praćenje');
        if (existing) {
          const existingId = existing.id ?? existing.watchlist_id;
          cy.request({
            method: 'DELETE',
            url: `${TRADING_SERVICE_URL}/watchlists/${existingId}`,
            headers: { Authorization: `Bearer ${authToken}` },
            failOnStatusCode: false,
          });
        }
      });

      // Kreiramo test watchlist koji će biti dostupan u dropdown-u
      cy.request({
        method: 'POST',
        url: `${TRADING_SERVICE_URL}/watchlists`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { name: 'Test praćenje' },
      }).then((createRes) => {
        expect(createRes.status).to.be.oneOf([200, 201]);
        watchlistId = createRes.body?.id ?? createRes.body?.watchlist_id ?? null;
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

  it('dodaje hartiju na watchlist i prikazuje je u detalju nakon klika kroz widget', () => {
    cy.intercept('GET', '**/listings/stocks*').as('getStocks');
    cy.intercept('POST', `**/watchlists/${watchlistId}/items`).as('addItem');

    cy.visit('/client/securities');
    cy.wait('@getStocks');

    // Čekamo da se tabela akcija učita
    cy.contains('tbody tr', testTicker, { timeout: 15000 }).should('be.visible');

    // Warmup: otvaramo widget i čekamo da se store popuni ("Test praćenje" tab mora biti vidljiv)
    // tek tada je store sigurno inicijalizovan i dropdown na zvezdici će prikazati listu
    cy.get('button[title="Liste praćenja"]').click();
    cy.contains('button', 'Test praćenje', { timeout: 15000 }).should('be.visible');
    cy.get('button[title="Liste praćenja"]').click(); // zatvaramo panel

    // Klik na red sa testTicker — otvara se detail panel (SecurityDetails)
    cy.contains('tbody tr', testTicker).click();

    // Čekamo da se SecurityDetails renderuje (dugme "Osveži" je jedinstveno za tu komponentu)
    cy.contains('button', 'Osveži', { timeout: 10000 }).should('be.visible');

    // Klik na WatchlistButton u SecurityDetails panelu:
    // Osveži → .parent() = refreshGroup div → .parent() = headerBtns div
    // headerBtns direktno sadrži WatchlistButton (div.wrap > button[aria-label="Watchlist"])
    cy.contains('button', 'Osveži')
      .parent()
      .parent()
      .find('button[aria-label="Watchlist"]')
      .click();

    // Dropdown je portalan na body — force:true zaobilazi scroll-to-view koji bi zatvorio dropdown
    cy.contains('span', 'Test praćenje', { timeout: 8000 }).click({ force: true });

    cy.wait('@addItem').then((interception) => {
      addedListingId = interception.request.body?.listing_id ?? testListingId;
      expect(interception.response?.statusCode, 'dodavanje na watchlist mora biti uspešno').to.be.oneOf([200, 201, 204]);
    });

    // Zvezdica postaje aktivna — title se menja na "Upravljaj listama praćenja"
    cy.contains('button', 'Osveži')
      .parent()
      .parent()
      .find('button[title="Upravljaj listama praćenja"]')
      .should('exist');

    // Klikamo na DRUGU hartiju da promenimo detail panel (da navigacija iz widgeta bude vidljiva)
    cy.get('tbody tr').not(`:contains("${testTicker}")`).first().click();

    // Postavljamo intercept za GET poziv koji će se pokrenuti kad kliknemo na hartiju u widgetu
    // (postavljamo GA POSLE prvog klika da ne uhvatimo taj poziv)
    cy.intercept('GET', `**/listings/stocks/${testListingId}`).as('loadFromWatchlist');

    // Otvaramo WatchlistWidget i klikamo na testTicker u listi
    cy.get('button[title="Liste praćenja"]').click();
    cy.contains('button', 'Test praćenje').click(); // osiguravamo da je pravi tab aktivan
    cy.get('button[title="Liste praćenja"]')
      .parent()
      .find('table')
      .contains('tr', testTicker)
      .click();

    // Čekamo GET poziv za detalj hartije koji se okida navigacijom iz widgeta
    cy.wait('@loadFromWatchlist').then((interception) => {
      expect(interception.response?.statusCode, 'detalj hartije mora biti 200').to.eq(200);
    });

    // Detail panel mora prikazivati testTicker — potvrđujemo kroz headerBtns wrapper
    cy.contains('button', 'Osveži')
      .parent()
      .parent()
      .parent()
      .should('contain.text', testTicker);
  });
});
