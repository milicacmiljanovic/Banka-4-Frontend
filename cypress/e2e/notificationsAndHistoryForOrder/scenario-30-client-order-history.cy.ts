/// <reference types="cypress" />
export {};

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const BANKING_SERVICE_URL = 'http://rafsi.davidovic.io:8081/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

// Pre testa kreiramo bar jedan order za Marka kako bi tabela imala podatke

before(() => {
  let markoToken: string;
  let markoId: number;

  cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
    email: 'marko.markovic@example.com',
    password: 'password123',
  }).then((loginRes) => {
    expect(loginRes.status).to.eq(200);
    markoToken = loginRes.body.token;
    markoId    = loginRes.body.user?.id ?? loginRes.body.id;

    return cy.request({
      method: 'GET',
      url: `${TRADING_SERVICE_URL}/listings/stocks?page=1&page_size=1`,
      headers: { Authorization: `Bearer ${markoToken}` },
    });
  }).then((stocksRes) => {
    const body = stocksRes.body;
    const stocks: any[] = Array.isArray(body) ? body : (body?.data ?? body?.items ?? body?.content ?? []);
    expect(stocks.length, 'mora postojati bar jedna hartija').to.be.greaterThan(0);
    const listingId: number = stocks[0].listing_id ?? stocks[0].id;

    return cy.request({
      method: 'GET',
      url: `${BANKING_SERVICE_URL}/clients/${markoId}/accounts?page=1&page_size=5`,
      headers: { Authorization: `Bearer ${markoToken}` },
      failOnStatusCode: false,
    }).then((accountsRes) => {
      const aBody = accountsRes.body;
      const accounts: any[] = Array.isArray(aBody) ? aBody : (aBody?.data ?? aBody?.items ?? aBody?.content ?? []);
      expect(accounts.length, 'Marko mora imati bar jedan račun').to.be.greaterThan(0);
      const accountNumber: string = accounts[0].account_number ?? accounts[0].AccountNumber;

      return cy.request({
        method: 'POST',
        url: `${TRADING_SERVICE_URL}/orders`,
        headers: { Authorization: `Bearer ${markoToken}` },
        body: {
          listing_id: listingId,
          direction: 'BUY',
          order_type: 'MARKET',
          quantity: 1,
          account_number: accountNumber,
        },
        failOnStatusCode: false,
      });
    });
  }).then((orderRes) => {
    expect(orderRes.status, 'kreiranje ordera za Marka').to.be.oneOf([200, 201]);
  });
});

describe('Scenario 30: Klijent vidi sve svoje prošle ordere', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('klijent otvori stranicu Moji orderi i vidi listu ordera', () => {
    cy.intercept('GET', '**/orders/my*').as('getMyOrders');

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.contains('h1', 'Moji orderi').should('be.visible');
    // Proveravamo kroz UI da tabela ima redove (robustnije od parsiranja formata tela odgovora)
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('tabela sadrži sve obavezne kolone', () => {
    cy.intercept('GET', '**/orders/my*').as('getMyOrders');

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
    cy.intercept('GET', '**/orders/my*').as('getMyOrders');

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

  it('klijent može filtrirati ordere po statusu DONE', () => {
    cy.intercept('GET', '**/orders/my*').as('getMyOrders');

    cy.visit('http://localhost:5173/orders/my');
    cy.wait('@getMyOrders');

    // Biramo select direktno unutar labele (ne .parent() — to bi zahvatilo sve selekte)
    cy.contains('label', 'Status').find('select').select('DONE');

    cy.wait('@getMyOrders');
  });
});
