import { buildStocks, loginAs, agentUser } from './helpers';

// NAPOMENA: Automatsko osvežavanje na intervalu trenutno nije implementirano
// u ClientSecurities.jsx — useFetch ne sadrži polling logiku.
// Ovaj test dokumentuje očekivano ponašanje i biće aktivan kada se
// interval-based refresh doda (npr. setInterval + refetch u useFetch ili komponenti).

describe('Scenario 17: Automatsko osvežavanje podataka na intervalu', () => {
  it('podaci se osvežavaju bez korisničke akcije nakon definisanog intervala', () => {
    let callCount = 0;

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, (req) => {
      callCount++;
      req.reply({ statusCode: 200, body: buildStocks() });
    }).as('getStocks');

    cy.clock();

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    // Simulacija prolaska definisanog intervala (npr. 30 sekundi)
    cy.tick(30_000);

    // Drugi poziv ka API-ju treba da se desi automatski
    cy.get('@getStocks.all').should('have.length.greaterThan', 1);
  });
});