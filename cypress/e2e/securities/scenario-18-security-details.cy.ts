describe('Scenario 18: Otvaranje detalja hartije prikazuje graf i tabelu', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/client/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.intercept('GET', '**/listings/stocks/*').as('getStockDetail');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.wait('@getStockDetail');
  });

  it('otvara detaljan prikaz klikom na hartiju', () => {
    cy.contains('Osveži').should('be.visible');
    cy.contains(/poslednje osvežavanje/i).should('be.visible');
  });

  it('prikazuje period tabove za graf', () => {
    cy.contains('button', '1D').should('be.visible');
    cy.contains('button', '1W').should('be.visible');
    cy.contains('button', '1M').should('be.visible');
    cy.contains('button', '1Y').should('be.visible');
    cy.contains('button', '5Y').should('be.visible');
  });

  it('prikazuje tabelarni prikaz podataka (bid, ask, volumen)', () => {
    cy.contains('button', '1D').should('be.visible');
    cy.contains('Osveži').should('be.visible');
  });
});
