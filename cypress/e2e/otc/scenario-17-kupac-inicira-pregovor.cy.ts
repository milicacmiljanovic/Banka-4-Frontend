/// <reference types="cypress" />

const USER_SERVICE_URL = Cypress.env('API_URL') as string;
const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

let scenarioAuthToken: string;
let createdOfferId: number | null = null;

describe('Scenario 17: Kupac inicira pregovor sa prodavcem', () => {
  before(() => {
    cy.request({
      method: 'POST',
      url: `${USER_SERVICE_URL}/auth/login`,
      body: {
        email: Cypress.env('MARKO_EMAIL') as string,
        password: Cypress.env('MARKO_PASSWORD') as string,
      },
      failOnStatusCode: false,
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

    cy.contains('tr', 'Ana Anic').find('button').contains(/Pošalji ponudu/i).click({ force: true });
    cy.get('.modal').should('be.visible');

    cy.contains('.label', /Volume/i).find('input').clear().type('2').blur();
    cy.contains('.label', /Price Offer/i).find('input').clear().type('1.0').blur();
    cy.get('input[type="date"]').clear().type('2026-06-18').blur();
    cy.contains('.label', /Premium/i).find('input').clear().type('0.5').blur();

    cy.get('select.input').should('be.visible').select(1);

    cy.get('.submitBtn').should('not.be.disabled').click();

    cy.wait('@createOffer').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      const resBody = interception.response?.body ?? {};
      createdOfferId = resBody.id ?? resBody.offer_id ?? resBody.offerId;
    });

    cy.contains(/uspešno/i).should('be.visible');
    cy.contains('button', /Aktivne ponude/i).click({ force: true });

    cy.wait('@getOffers');
    cy.get('table').should('be.visible');
  });
});

export {};
