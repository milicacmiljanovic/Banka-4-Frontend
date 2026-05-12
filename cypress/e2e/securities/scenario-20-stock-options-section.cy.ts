describe('Scenario 20: Detaljan prikaz akcije sadrži sekciju sa opcijama', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.contains('button', 'Osveži', { timeout: 10000 }).should('be.visible');
  });

  it('prikazuje sekciju Opcije', () => {
    cy.contains('h3', 'Opcije').should('be.visible');
  });

  it('opcijska tabela sadrži CALLS i PUTS zaglavlja', () => {
    cy.contains('CALLS').should('be.visible');
    cy.contains('PUTS').should('be.visible');
  });

  it('prikazuje kolone strike, bid, ask, vol, OI unutar tabele opcija', () => {
    cy.contains('h3', 'Opcije').closest('section').within(() => {
      cy.contains('STRIKE').should('exist');
      cy.contains('Bid').should('exist');
      cy.contains('Ask').should('exist');
      cy.contains('Vol').should('exist');
      cy.contains('OI').should('exist');
    });
  });

  it('prikazuje datum isteka u toolbar-u opcija', () => {
    cy.contains('h3', 'Opcije').closest('section').within(() => {
      cy.contains(/\d{4}/).should('exist');
    });
  });

  it('prikazuje Shared Price banner', () => {
    cy.contains('Tržišna cena akcije (Shared Price)').should('be.visible');
  });
});
