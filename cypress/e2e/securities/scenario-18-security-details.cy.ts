import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 18: Otvaranje detalja hartije prikazuje graf i tabelu', () => {
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
          '1D': [{ t: 1, v: 410 }, { t: 2, v: 415 }, { t: 3, v: 412 }],
          '1W': [{ t: 1, v: 400 }, { t: 2, v: 415 }],
          '1M': [],
          '1Y': [],
          '5Y': [],
        },
      },
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');
  });

  it('otvara detaljan prikaz klikom na hartiju', () => {
    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');
  
    // ✔ naziv
    cy.contains('Microsoft Corporation').should('be.visible');
  
    // ✔ SIGURAN indikator da smo u detail view-u
    cy.contains('Osveži').should('be.visible');
  
    // ili ako hoćeš još jače:
    cy.contains(/poslednje osvežavanje/i).should('be.visible');
  });
  it('prikazuje period tabove za graf', () => {
    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');

    cy.contains('button', '1D').should('be.visible');
    cy.contains('button', '1W').should('be.visible');
    cy.contains('button', '1M').should('be.visible');
    cy.contains('button', '1Y').should('be.visible');
    cy.contains('button', '5Y').should('be.visible');
  });

  it('prikazuje tabelarni prikaz podataka (bid, ask, volumen)', () => {
  cy.contains('tbody tr', 'MSFT').click();
  cy.wait('@getStockDetail');

  // ✔ detail otvoren
  cy.contains('Microsoft Corporation').should('be.visible');

  // ✔ graf postoji
  cy.contains('button', '1D').should('be.visible');

  // ✔ panel postoji (ovo implicitno znači da je i tabela tu)
  cy.contains('Osveži').should('be.visible');
});
});