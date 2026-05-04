import { buildStocks, loginAs, agentUser } from './helpers';

// buildStocks() sadrži: MSFT (NASDAQ), AAPL (NASDAQ), JPM (NYSE)
// Filter po "NY" treba da prikaže samo NYSE hartije (JPM)
describe('Scenario 14: Filtriranje po exchange prefix-u radi ispravno', () => {
  it('prikazuju se samo hartije sa exchange oznakom koja počinje sa zadatim prefixom', () => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');
    cy.contains('JPM').should('be.visible');

    // Otvori panel filtera
    cy.contains('button', 'Filteri').click();

    // Unesi prefix exchange-a
    cy.get('input[placeholder="npr. NASDAQ, CME..."]').type('NY');

    // Primeni filtere
    cy.contains('button', 'Primeni filtere').click();

    // Samo NYSE hartije su vidljive (JPM)
    cy.contains('JPM').should('be.visible');
    cy.contains('NYSE').should('be.visible');

    // NASDAQ hartije nisu vidljive
    cy.contains('MSFT').should('not.exist');
    cy.contains('AAPL').should('not.exist');
  });
});
