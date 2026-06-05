/// <reference types="cypress" />

describe('Scenario 18: Prodavac šalje protivponudu', () => {
  // Konstante za servise
  const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';
  const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';
  const ANA_EMAIL = 'ana.anic@example.com';
  const ANA_PASSWORD = 'password123';

  // Inicijalizacija promenljivih (nema više crvenila)
  let authToken: string = '';
  let activeOfferId: number | null = null;

  before(() => {
    // Setup: Login za dobijanje tokena za cleanup
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, { 
      email: ANA_EMAIL, 
      password: ANA_PASSWORD 
    }).then((res) => {
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    activeOfferId = null;
    cy.loginAsClientAna();
    cy.visit('/otc');
  });

  afterEach(() => {
    // Cleanup: Ako je ponuda menjana, vraćamo je na početno stanje
    if (!activeOfferId || !authToken) return;

    cy.request({
      method: 'PUT',
      url: `${TRADING_SERVICE_URL}/otc/offers/${activeOfferId}/counter`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { price_per_stock_rsd: 1.0, premium: 0.1 }, // Vraćamo na default vrednosti
      failOnStatusCode: false
    });
  });

  it('uspešno šalje protivponudu sa izmenjenim uslovima', () => {
    cy.intercept('PUT', '**/api/otc/offers/*/counter').as('sendCounterOffer');
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');

    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers');

    // Uzimanje ID-ja prve ponude iz tabele
    cy.get('table tbody tr').first().then(($tr) => {
      const id = $tr.attr('data-id'); // Proveri da li je ovo 'data-id' ili 'id'
      activeOfferId = id ? parseInt(id) : null;
    });

    cy.get('table tbody tr').first().find('button').contains(/Detalji/i).click();

    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .select(1);

    cy.contains('button', /^Kontraponuda$/i).click({ force: true });

    cy.contains('label', /Price per stock/i)
      .parent()
      .find('input')
      .clear()
      .type('0.52')
      .blur();

    cy.contains('button', /Pošalji kontraponudu/i).click();

    cy.wait('@sendCounterOffer').its('response.statusCode').should('eq', 200);
    cy.contains('div', /Kontraponuda je uspešno poslata/i).should('be.visible');
  });
});