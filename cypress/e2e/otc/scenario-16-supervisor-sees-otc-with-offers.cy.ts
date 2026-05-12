import { supervisorUser, loginAs, buildPublicListing, buildOffer } from './helpers';

const actuaryOffer = buildOffer({
  otc_offer_id: 301,
  ticker: 'TSLA',
  amount: 200,
  price_per_stock_rsd: 25000.00,
  settlement_date: '2099-06-30T00:00:00Z',
  buyer_id: 9001,
  seller_id: 9002,
});

describe('Scenario 16: Supervizor vidi OTC portal sa ponudama aktuara', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/public*', {
      statusCode: 200,
      body: [
        buildPublicListing({ asset_ownership_id: 10, ticker: 'NVDA', name: 'Nvidia Corp.', owner_name: 'Aktuar Petar', available_amount: 75, price: 850.00 }),
      ],
    }).as('getPublicListings');

    cy.intercept('GET', '**/otc/offers/active*', {
      statusCode: 200,
      body: [actuaryOffer],
    }).as('getNegotiations');

    cy.intercept('GET', '**/clients/*/accounts*', { statusCode: 200, body: { data: [] } }).as('getAccounts');

    loginAs(supervisorUser, '/otc');
  });

  it('supervizor vidi OTC portal i tab Dostupne akcije', () => {
    cy.wait('@getPublicListings');
    cy.contains('h1', 'OTC Ponude i Ugovori').should('be.visible');
    cy.contains('button', 'Dostupne akcije').should('be.visible');
  });

  it('supervizor vidi ponude na tabu Aktivne ponude', () => {
    cy.wait('@getPublicListings');
    cy.contains('button', 'Aktivne ponude').click();
    cy.wait('@getNegotiations');
    cy.contains('td', 'TSLA').should('be.visible');
    cy.contains('td', '200').should('be.visible');
  });

  it('supervizor može kreirati ponudu za pregovor putem dugmeta', () => {
    cy.wait('@getPublicListings');
    cy.contains('tr', 'NVDA').within(() => {
      cy.contains('button', 'Pošalji ponudu').should('be.visible').and('not.be.disabled');
    });
  });

  it('supervizor vidi sve tabove portala', () => {
    cy.wait('@getPublicListings');
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.contains('button', 'Aktivne ponude').should('be.visible');
    cy.contains('button', 'Sklopljeni ugovori').should('be.visible');
  });
});
