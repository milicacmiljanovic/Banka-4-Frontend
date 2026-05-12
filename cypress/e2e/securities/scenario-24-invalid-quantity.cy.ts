describe('Scenario 24: Kreiranje ordera sa nevalidnom količinom', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', 'Kreiraj nalog').click();
    });
    cy.contains('h3', /Kreiraj nalog/i).should('be.visible');
  });

  it('prikazuje grešku za količinu 0', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('0');
    cy.contains('Količina mora biti pozitivan').should('be.visible');
  });

  it('prikazuje grešku za negativnu količinu', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('-5');
    cy.contains('Količina mora biti pozitivan').should('be.visible');
  });

  it('dugme Nastavi je disabled dok je količina nevalidna', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('0');
    cy.contains('button', 'Nastavi').should('be.disabled');
  });
});
