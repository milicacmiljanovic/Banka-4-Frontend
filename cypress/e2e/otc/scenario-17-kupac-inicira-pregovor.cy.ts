/// <reference types="cypress" />

const baseApiUrl = Cypress.env('API_URL') && !Cypress.env('API_URL').includes('localhost') 
  ? Cypress.env('API_URL') 
  : 'http://rafsi.davidovic.io:8080/api';

const USER_SERVICE_URL = baseApiUrl; 
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

const MARKO_EMAIL = 'marko.markovic@example.com';
const MARKO_PASSWORD = 'password123';

let scenarioAuthToken: string;
let createdOfferId: number | null = null;

describe('Scenario 17: Kupac inicira pregovor sa prodavcem', () => {
  before(() => {
    cy.request({
      method: 'POST',
      url: `${USER_SERVICE_URL}/auth/login`,
      body: { email: MARKO_EMAIL, password: MARKO_PASSWORD },
      failOnStatusCode: false
    }).then((res) => {
      if (res.status === 200) scenarioAuthToken = res.body.token;
    });
  });

  beforeEach(() => {
    createdOfferId = null;
    cy.intercept('GET', '**/api/otc/public*').as('getListings');
    cy.intercept('POST', '**/api/otc/offers*').as('createOffer');
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');

    cy.loginAsClient();
    cy.visit('/otc');
  });

  afterEach(() => {
    if (!createdOfferId || !scenarioAuthToken) return;

    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/otc/offers/${createdOfferId}/reject`,
      headers: { Authorization: `Bearer ${scenarioAuthToken}` },
      failOnStatusCode: false,
    });
  });

  it('uspešno inicira pregovor popunjavanjem Make an Offer forme i prikazuje je u aktivnim ponudama', () => {
    cy.wait('@getListings');
    cy.get('table', { timeout: 15000 }).should('be.visible');

    // 1. Otvaranje modala
    cy.contains('tr', 'Ana Anic').find('button').contains(/Pošalji ponudu/i).click({ force: true });
    cy.get('.modal').should('be.visible');

    // 2. Unos podataka sa .blur() da bi aplikacija registrovala izmene
    cy.contains('.label', /Volume/i).find('input').clear().type('2').blur();
    cy.contains('.label', /Price Offer/i).find('input').clear().type('1.0').blur();
    cy.get('input[type="date"]').clear().type('2026-06-18').blur();
    cy.contains('.label', /Premium/i).find('input').clear().type('0.5').blur();

    // 3. Izbor računa
    cy.get('select.input').should('be.visible').select(1);

    // 4. Slanje i hvatanje odgovora (SAMO JEDAN WAIT)
    cy.get('.submitBtn').should('not.be.disabled').click();

    cy.wait('@createOffer').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      
      const resBody = interception.response?.body ?? {};
      createdOfferId = resBody.id ?? resBody.offer_id ?? resBody.offerId;
    });

    // 5. Verifikacija uspeha i tabova
    cy.contains(/uspešno/i).should('be.visible');
    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    
    cy.wait('@getOffers');
    cy.get('table').should('be.visible');
  });
});

export {};