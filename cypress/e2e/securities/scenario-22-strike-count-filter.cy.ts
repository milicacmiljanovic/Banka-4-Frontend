describe('Scenario 22: Filtriranje broja prikazanih strike vrednosti opcija', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.contains('tbody tr', 'CBFV').click();
    cy.contains('h3', 'Opcije', { timeout: 10000 }).should('be.visible');
  });

  it('defaultno prikazuje strike-ove (strikeCount=4)', () => {
    cy.get('tr[class*="optionRow"]').should('have.length.at.least', 4);
  });

  it('postavljanje Strikes ± na 2 prikazuje 2 reda iznad i 2 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('2');
    cy.get('tr[class*="optionRow"]').should('have.length', 4);
  });

  it('postavljanje Strikes ± na 3 prikazuje 3 reda iznad i 3 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('3');
    cy.get('tr[class*="optionRow"]').should('have.length', 6);
  });

  it('postavljanje Strikes ± na 1 prikazuje 1 red iznad i 1 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('1');
    cy.get('tr[class*="optionRow"]').should('have.length', 2);
  });
});
