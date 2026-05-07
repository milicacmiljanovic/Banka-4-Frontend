import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 17: Automatsko osvežavanje podataka na intervalu', () => {
  it('podaci se osvežavaju bez korisničke akcije nakon 30 sekundi', () => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.clock();

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.tick(100);
    // Simulacija prolaska 30 sekundi — interval okida refetch
    cy.tick(30_000);

    cy.get('@getStocks.all').should('have.length', 2);

    // Ukupno 2 poziva: inicijalni + jedan automatski
    cy.get('@getStocks.all').should('have.length', 2);
  });

  it('ne šalje request dok je prethodni u toku', () => {
    let callCount = 0;

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, (req) => {
      callCount++;
      // Simuliramo spor odgovor na prvom pozivu
      req.reply({ statusCode: 200, body: buildStocks(), delay: 35_000 });
    }).as('getStocksSlowFirst');

    cy.clock();

    loginAs(agentUser, '/securities');

    // Tick od 30s dok je inicijalni request još u toku — ne sme da se okine novi
    cy.tick(30_000);

    cy.get('@getStocksSlowFirst.all').should('have.length', 1);
  });
});
