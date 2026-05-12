import { clientWithTrading, loginAs, buildOffer } from './helpers';

const negotiations = [
  buildOffer({
    otc_offer_id: 101,
    ticker: 'AAPL',
    amount: 50,
    price_per_stock_rsd: 18000.00,
    settlement_date: '2099-08-15T00:00:00Z',
    buyer_id: 2001,
    seller_id: 9002,
    premium: 200.00,
  }),
  buildOffer({
    otc_offer_id: 102,
    ticker: 'MSFT',
    amount: 30,
    price_per_stock_rsd: 41500.00,
    settlement_date: '2099-09-01T00:00:00Z',
    buyer_id: 9003,
    seller_id: 2001,
    premium: 150.00,
  }),
];

describe('Scenario 23: Stranica Aktivne ponude prikazuje sve aktivne pregovore', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/public*', { statusCode: 200, body: [] }).as('getPublic');

    cy.intercept('GET', '**/otc/offers/active*', {
      statusCode: 200,
      body: negotiations,
    }).as('getNegotiations');

    cy.intercept('GET', '**/clients/*/accounts*', {
      statusCode: 200,
      body: { data: [{ accountNumber: '265-1111111111111-11', name: 'Glavni račun', balance: 50000, currency: 'RSD' }] },
    }).as('getAccounts');

    loginAs(clientWithTrading, '/otc');
    cy.wait('@getPublic');
    cy.contains('button', 'Aktivne ponude').click();
    cy.wait('@getNegotiations');
  });

  it('vidi listu svih aktivnih pregovora', () => {
    cy.get('tbody tr').should('have.length', 2);
  });

  it('vidi ticker (akciju) za svaki pregovor', () => {
    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('be.visible');
  });

  it('vidi količinu za svaki pregovor', () => {
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('td', '50').should('be.visible');
    });
    cy.contains('tr', 'MSFT').within(() => {
      cy.contains('td', '30').should('be.visible');
    });
  });

  it('vidi cenu za svaki pregovor', () => {
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('18000').should('be.visible');
    });
  });

  it('vidi settlementDate za svaki pregovor', () => {
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('td', /2099|15\.08|8\/15/).should('be.visible');
    });
  });

  it('vidi s kim pregovara za svaki pregovor', () => {
    cy.contains('tr', 'AAPL').within(() => {
      cy.get('td').contains(/Prodavac|Kupac|ID:\s*9002/).should('be.visible');
    });
  });

  it('svaki pregovor ima dugme Detalji', () => {
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Detalji').should('be.visible');
    });
    cy.contains('tr', 'MSFT').within(() => {
      cy.contains('button', 'Detalji').should('be.visible');
    });
  });
});
