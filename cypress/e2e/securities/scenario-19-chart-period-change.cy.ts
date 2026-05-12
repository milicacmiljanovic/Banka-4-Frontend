describe('Scenario 19: Promena perioda na grafiku menja prikazane podatke', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/client/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');

    cy.get('table tbody tr', { timeout: 10000 }).first().click();

    cy.contains('button', 'Osveži', { timeout: 10000 }).should('be.visible');
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