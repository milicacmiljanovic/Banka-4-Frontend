describe('Scenario 38: Supervizor uspešno kreira novi investicioni fond', () => {
  it('kreira fond i fond postaje vidljiv na discovery stranici', () => {
    const uniqueName = `Cypress Fund ${Date.now()}`;

    cy.loginAsAdmin();
    cy.visit('/investment-funds/new');

    cy.url().should('include', '/investment-funds/new');
    cy.contains('Kreiranje investicionog fonda').should('be.visible');

    cy.get('input[placeholder="npr. Globalni rast"]').should('be.visible').clear();
    cy.get('input[placeholder="npr. Globalni rast"]').type(uniqueName);

    cy.get('textarea[placeholder*="Kratki opis"]').should('be.visible').clear();
    cy.get('textarea[placeholder*="Kratki opis"]').type('Fond kreiran kroz Cypress test.');

    cy.get('input[placeholder="npr. 10000"]').should('be.visible').clear();
    cy.get('input[placeholder="npr. 10000"]').type('1000');

    cy.contains('button', 'Kreiraj fond').click();

    cy.url().should('include', '/investment-funds');
    cy.contains('Fond "', { matchCase: false }).should('be.visible');
    cy.contains(uniqueName).should('be.visible');
  });
});