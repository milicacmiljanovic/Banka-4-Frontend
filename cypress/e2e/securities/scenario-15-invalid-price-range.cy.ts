describe('Scenario 15: Filtriranje sa nevalidnim opsegom cene', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/client/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
  });

  it('prikazuje grešku kad je minimalna cena veća od maksimalne', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="number"][placeholder="Min"]').first().clear().type('500');
    cy.get('input[type="number"][placeholder="Max"]').first().clear().type('100');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('minimalna vrednost ne može biti veća od maksimalne').should('be.visible');
  });

  it('filtriranje se ne primenjuje — sve hartije ostaju vidljive', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="number"][placeholder="Min"]').first().clear().type('500');
    cy.get('input[type="number"][placeholder="Max"]').first().clear().type('100');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('button', 'Primeni filtere').should('be.visible');
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });
});