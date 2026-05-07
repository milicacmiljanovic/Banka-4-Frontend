import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 19: Promena perioda na grafiku menja prikazane podatke', () => {
  beforeEach(() => {
    const stocks = buildStocks();

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: stocks,
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${stocks[0].listing_id}` }, {
      statusCode: 200,
      body: {
        ...stocks[0],
        priceHistory: {
          '1D': [{ t: 1, v: 410 }, { t: 2, v: 415 }],
          '1W': [{ t: 1, v: 400 }, { t: 2, v: 420 }],
          '1M': [{ t: 1, v: 380 }, { t: 2, v: 415 }],
          '1Y': [{ t: 1, v: 300 }, { t: 2, v: 415 }],
          '5Y': [{ t: 1, v: 100 }, { t: 2, v: 415 }],
        },
      },
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');
  });

  it('1D period je aktivan po defaultu', () => {
    cy.contains('button', '1D')
      .invoke('attr', 'class')
      .should('include', 'periodActive');
  });

  it('klikom na 1W se menja aktivan period', () => {
    cy.contains('button', '1W').click();

    cy.contains('button', '1W')
      .invoke('attr', 'class')
      .should('include', 'periodActive');

    cy.contains('button', '1D')
      .invoke('attr', 'class')
      .should('not.include', 'periodActive');
  });

  it('svi periodi su dostupni i klikabilni', () => {
    ['1D', '1W', '1M', '1Y', '5Y'].forEach(period => {
      cy.contains('button', period).click();
      cy.contains('button', period)
        .invoke('attr', 'class')
        .should('include', 'periodActive');
    });
  });
}); 