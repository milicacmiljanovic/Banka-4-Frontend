import { supervisorUser, loginAs } from './helpers';

// OtcPonudePage (/otc/ponude) koristi offer.price_per_stock i offer.market_price za računanje odstupanja
// CSS: rowGreen=#f0fdf4, rowYellow=#fefce8, rowRed=#fff5f5
const offers = [
  {
    otc_offer_id: 1,
    ticker: 'GREEN',
    amount: 10,
    price_per_stock: 103,
    market_price: 100,     // 3% odstupanje → zeleno
    settlement_date: '2099-12-31T00:00:00Z',
    premium: 5,
    buyer_id: 2001,
    seller_id: 9002,
    status: 'PENDING',
  },
  {
    otc_offer_id: 2,
    ticker: 'YELLOW',
    amount: 10,
    price_per_stock: 110,
    market_price: 100,     // 10% odstupanje → žuto
    settlement_date: '2099-12-31T00:00:00Z',
    premium: 5,
    buyer_id: 2001,
    seller_id: 9002,
    status: 'PENDING',
  },
  {
    otc_offer_id: 3,
    ticker: 'RED',
    amount: 10,
    price_per_stock: 130,
    market_price: 100,     // 30% odstupanje → crveno
    settlement_date: '2099-12-31T00:00:00Z',
    premium: 5,
    buyer_id: 2001,
    seller_id: 9002,
    status: 'PENDING',
  },
];

describe('Scenario 24: Vizualizacija odstupanja u ponudama bojama', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/offers/active*', {
      statusCode: 200,
      body: offers,
    }).as('getNegotiations');

    loginAs(supervisorUser, '/otc/ponude');
    cy.wait('@getNegotiations');
  });

  it('ponude sa odstupanjem do 5% su zelene', () => {
    cy.contains('tr', 'GREEN').should(($row) => {
      const bg = window.getComputedStyle($row[0]).backgroundColor;
      expect(bg).to.equal('rgb(240, 253, 244)');
    });
  });

  it('ponude sa odstupanjem 5% do 20% su žute', () => {
    cy.contains('tr', 'YELLOW').should(($row) => {
      const bg = window.getComputedStyle($row[0]).backgroundColor;
      expect(bg).to.equal('rgb(254, 252, 232)');
    });
  });

  it('ponude sa odstupanjem većim od 20% su crvene', () => {
    cy.contains('tr', 'RED').should(($row) => {
      const bg = window.getComputedStyle($row[0]).backgroundColor;
      expect(bg).to.equal('rgb(255, 245, 245)');
    });
  });

  it('sve tri ponude su vidljive u tabeli', () => {
    cy.contains('td', 'GREEN').should('be.visible');
    cy.contains('td', 'YELLOW').should('be.visible');
    cy.contains('td', 'RED').should('be.visible');
  });
});
