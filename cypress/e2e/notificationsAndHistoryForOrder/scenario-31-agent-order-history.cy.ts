/// <reference types="cypress" />
export {};

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

// before() proverava da li Jelena ima ordere u backendu.
// Testovi 2 i 3 zahtevaju bar jedan red u tabeli da bi <th> kolone bile vidljive.
// Ako Jelena ima ordere → koristimo prave podatke bez mocka.
// Ako nema → koristimo mock fallback da prikažemo header.

before(() => {
  cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
    email: 'jelena@raf.rs',
    password: 'pass123',
  }).then((loginRes) => {
    const token: string = loginRes.body.token;
    return cy.request({
      method: 'GET',
      url: `${TRADING_SERVICE_URL}/orders/my?page=1&page_size=10`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  }).then((ordersRes) => {
    const orders: any[] = Array.isArray(ordersRes.body)
      ? ordersRes.body
      : (ordersRes.body?.data ?? ordersRes.body?.items ?? ordersRes.body?.content ?? []);
    Cypress.env('s31_jelenaHasOrders', orders.length > 0);
    cy.log(`S31: Jelena ima ${orders.length} order(a) u backendu`);
  });
});

describe('Scenario 31: Agent vidi sve svoje prošle ordere', () => {
  beforeEach(() => {
    cy.loginAsJelena();
  });

  it('agent otvori stranicu Moji orderi i stranica se učita ispravno', () => {
    cy.intercept('GET', '**/trading-service/api/orders/my*').as('getMyOrders');

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.contains('h1', 'Moji orderi').should('be.visible');
  });

  it('agent vidi iste kolone kao klijent', () => {
    const jelenaHasOrders: boolean = Cypress.env('s31_jelenaHasOrders') ?? false;

    if (!jelenaHasOrders) {
      cy.log('Jelena nema orderâ u backendu → koristimo mock da prikažemo kolone');
      cy.intercept('GET', '**/trading-service/api/orders/my*', {
        statusCode: 200,
        body: [{
          order_id: 1,
          order_type: 'MARKET',
          ticker: 'AAPL',
          listing_name: 'Apple Inc.',
          quantity: 5,
          price_per_unit: 150.0,
          status: 'DONE',
          created_at: '2026-01-01T10:00:00Z',
          execution_date: '2026-01-01T10:05:00Z',
          commission_charged: true,
        }],
      }).as('getMyOrders');
    } else {
      cy.log('Jelena ima ordere u backendu → koristimo prave podatke');
      cy.intercept('GET', '**/trading-service/api/orders/my*').as('getMyOrders');
    }

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders');

    cy.contains('th', 'Tip ordera').should('be.visible');
    cy.contains('th', 'Hartija').should('be.visible');
    cy.contains('th', 'Količina').should('be.visible');
    cy.contains('th', 'Cena').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
    cy.contains('th', 'Datum kreiranja').should('be.visible');
    cy.contains('th', 'Datum izvršenja').should('be.visible');
    cy.contains('th', 'Plaćena provizija').should('be.visible');
  });

  it('svaki order u tabeli ima popunjene ključne vrednosti', () => {
    const jelenaHasOrders: boolean = Cypress.env('s31_jelenaHasOrders') ?? false;

    if (!jelenaHasOrders) {
      cy.log('Jelena nema orderâ → koristimo mock za prikaz reda u tabeli');
      cy.intercept('GET', '**/trading-service/api/orders/my*', {
        statusCode: 200,
        body: [{
          order_id: 2,
          order_type: 'LIMIT',
          ticker: 'MSFT',
          listing_name: 'Microsoft Corp.',
          quantity: 3,
          price_per_unit: 400.0,
          status: 'APPROVED',
          created_at: '2026-02-01T09:00:00Z',
          execution_date: null,
          commission_charged: false,
        }],
      }).as('getMyOrders');
    } else {
      cy.log('Jelena ima ordere u backendu → koristimo prave podatke');
      cy.intercept('GET', '**/trading-service/api/orders/my*').as('getMyOrders');
    }

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders');

    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('td').eq(0).invoke('text').should('not.be.empty');
        cy.get('td').eq(2).invoke('text').should('not.be.empty');
        cy.get('td').eq(4).invoke('text').should('not.be.empty');
      });
    });
  });

  it('agent može filtrirati ordere po tipu MARKET', () => {
    cy.intercept('GET', '**/trading-service/api/orders/my*').as('getMyOrders');

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders');

    cy.contains('label', 'Tip ordera').find('select').select('MARKET');

    cy.wait('@getMyOrders');
  });
});
