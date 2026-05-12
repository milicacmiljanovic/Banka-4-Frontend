describe('Scenario 17: Automatsko osvežavanje podataka na intervalu', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('podaci se osvežavaju bez korisničke akcije nakon 30 sekundi', () => {
    cy.intercept('GET', '**/listings/stocks*').as('getStocks');
    cy.clock();
    cy.visit('/client/securities');
    cy.wait('@getStocks');

    cy.tick(30_000);
    cy.wait('@getStocks');

    cy.get('@getStocks.all').should('have.length', 2);
  });

  it('ne šalje request dok je prethodni u toku', () => {
    cy.intercept('GET', '**/listings/stocks*', (req) => {
      req.reply({ statusCode: 200, body: [], delay: 35_000 });
    }).as('getStocksSlowFirst');
    cy.clock();
    cy.visit('/client/securities');

    cy.tick(30_000);

    cy.get('@getStocksSlowFirst.all').should('have.length', 1);
  });
});
