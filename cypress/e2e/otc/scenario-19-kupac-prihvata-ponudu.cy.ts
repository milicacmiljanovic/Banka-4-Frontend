/// <reference types="cypress" />

export {};

describe('Scenario 19: Kupac prihvata ponudu', () => {
  const USER_SERVICE_URL = Cypress.env('API_URL') as string;
  const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

  let authToken: string;
  let acceptedOfferId: number | null = null;

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: Cypress.env('MARKO_EMAIL') as string,
      password: Cypress.env('MARKO_PASSWORD') as string,
    }).then((res) => {
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    acceptedOfferId = null;
    cy.loginAsClient();
    cy.visit('/otc');
  });

  afterEach(() => {
    if (!acceptedOfferId) return;
    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/otc/offers/${acceptedOfferId}/reject`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    });
  });

  it('kupac uspešno prihvata ponudu', () => {
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');
    cy.intercept('PATCH', '**/api/otc/offers/*/accept').as('acceptOffer');

    cy.contains('button', /Aktivne ponude/i).click();

    cy.wait('@getOffers').then((interception) => {
      const offers = interception.response?.body ?? [];
      const validOffer = Array.isArray(offers)
        ? offers.find((o: { otc_offer_id?: number }) => o.otc_offer_id !== undefined)
        : undefined;
      expect(validOffer, 'Nema aktivnih ponuda').to.not.be.undefined;
      acceptedOfferId = validOffer.otc_offer_id;
    });

    cy.get('table tbody tr').first().find('button').contains(/Detalji/i).click();

    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .select(1);

    cy.contains('button', /^Prihvati$/i).should('be.visible').click();

    cy.wait('@acceptOffer').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains(/Ponuda je uspešno prihvaćena/i).should('be.visible');
  });
});
