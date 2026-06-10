/// <reference types="cypress" />

export {};

describe('Scenario 18: Prodavac šalje protivponudu', () => {
  const USER_SERVICE_URL = Cypress.env('API_URL') as string;
  const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

  let authToken: string = '';
  let activeOfferId: number | null = null;

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: Cypress.env('ANA_EMAIL') as string,
      password: Cypress.env('ANA_PASSWORD') as string,
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
    if (!activeOfferId || !authToken) return;

    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/otc/offers/${activeOfferId}/reject`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    });
  });

  it('uspešno šalje protivponudu sa izmenjenim uslovima', () => {
    cy.intercept('PUT', '**/api/otc/offers/*/counter').as('sendCounterOffer');
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');

    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers');

    cy.get('table tbody tr').first().then(($tr) => {
      const id = $tr.attr('data-id');
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
