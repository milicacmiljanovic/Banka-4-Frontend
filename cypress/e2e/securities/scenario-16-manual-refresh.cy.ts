describe('Scenario 16: Ručno osvežavanje podataka o hartiji', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/client/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
  });

  it('osvežava podatke hartije i prikazuje novo vreme poslednjeg osvežavanja', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().click();

    cy.contains('button', 'Osveži', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="last-updated"]')
      .should('be.visible')
      .invoke('text')
      .then((firstTimestamp) => {

        cy.wait(1100);

        cy.contains('button', 'Osveži').click();

        cy.get('[data-testid="last-updated"]', { timeout: 10000 })
          .invoke('text')
          .should((secondTimestamp) => {
            expect(secondTimestamp).not.to.eq(firstTimestamp);
          });
      });
  });
});