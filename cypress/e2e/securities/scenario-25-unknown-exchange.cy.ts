import { buildStocks, loginAs, agentUser } from './helpers';

// NAPOMENA: Filtriranje hartija sa nepostojećim/praznim exchange-om nije
// implementirano u applyFilters() u ClientSecurities.jsx. Ovaj test dokumentuje
// očekivano ponašanje. Test će proći tek kada se ta validacija doda na frontendu.

describe('Scenario 25: Prikaz hartija sa nepoznatog exchange-a', () => {
  it('hartije sa null exchange-om se ne prikazuju', () => {
    const knownStock = buildStocks()[0]; // MSFT, exchange: NASDAQ
    const unknownExchangeStock = {
      ...buildStocks()[1], // AAPL
      exchange: null,
      listing_id: 999,
      ticker: 'UNKN',
      name: 'Unknown Exchange Corp',
    };

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [knownStock, unknownExchangeStock],
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('MSFT').should('be.visible');
    cy.contains('UNKN').should('not.exist');
  });

  it('hartije sa praznim exchange-om se ne prikazuju', () => {
    const knownStock = buildStocks()[0]; // MSFT
    const emptyExchangeStock = {
      ...buildStocks()[2], // JPM
      exchange: '',
      listing_id: 998,
      ticker: 'EMPTY',
      name: 'Empty Exchange Corp',
    };

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [knownStock, emptyExchangeStock],
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('MSFT').should('be.visible');
    cy.contains('EMPTY').should('not.exist');
  });
});