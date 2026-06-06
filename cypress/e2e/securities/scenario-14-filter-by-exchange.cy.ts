import { buildStocks, buildFutures, buildForex, loginAs, agentUser } from './helpers';

// buildStocks() sadrži: MSFT (NASDAQ), AAPL (NASDAQ), JPM (NYSE)
// Filter po "NY" treba da prikaže samo NYSE hartije (JPM)
describe('Scenario 14: Filtriranje po exchange prefix-u radi ispravno', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/listings/stocks*', {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/listings/futures*', {
      statusCode: 200,
      body: [buildFutures()],
    });

    cy.intercept('GET', '**/listings/forex*', {
      statusCode: 200,
      body: buildForex(),
    });

    cy.intercept('GET', '**/listings/options*', {
      statusCode: 200,
      body: [],
    });

    cy.intercept('GET', '**/otc/offers/active*', {
      statusCode: 200,
      body: [],
    });

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');
  });

  it('prikazuju se samo hartije sa exchange oznakom koja počinje sa zadatim prefixom', () => {
    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');
    cy.contains('JPM').should('be.visible');

    cy.contains('button', 'Filteri').click();

    cy.get('input[placeholder="npr. NASDAQ, CME..."]').type('NY');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('JPM').should('be.visible');
    cy.contains('NYSE').should('be.visible');

    cy.contains('MSFT').should('not.exist');
    cy.contains('AAPL').should('not.exist');
  });
});
