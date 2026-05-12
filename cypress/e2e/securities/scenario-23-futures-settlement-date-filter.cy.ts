describe('Scenario 23: Filtriranje futures ugovora po Settlement Date', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.contains('button', 'Futures').click();
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('prikazuje futures ugovore pre filtriranja', () => {
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('filter koji ne pokriva nijedan datum prikazuje praznu tabelu', () => {
    cy.contains('button', 'Filteri').click();
    cy.get('input[type="date"]').first().type('2000-01-01');
    cy.get('input[type="date"]').last().type('2000-12-31');
    cy.contains('button', 'Primeni filtere').click();
    cy.contains('Nema hartija za prikaz.').should('be.visible');
  });

  it('resetovanje filtera vraća sve futures', () => {
    cy.contains('button', 'Filteri').click();
    cy.get('input[type="date"]').first().type('2000-01-01');
    cy.get('input[type="date"]').last().type('2000-12-31');
    cy.contains('button', 'Primeni filtere').click();
    cy.contains('Nema hartija za prikaz.').should('be.visible');

    cy.contains('button', 'Filteri').click();
    cy.contains('button', 'Resetuj sve').click();
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });
});
