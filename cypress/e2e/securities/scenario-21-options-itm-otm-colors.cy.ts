const GREEN = '16, 185, 129';
const RED   = '239, 68, 68';

describe('Scenario 21: Tabela opcija prikazuje ITM i OTM polja bojom', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).first().click();
    cy.contains('h3', 'Opcije', { timeout: 10000 }).should('be.visible');
  });

  it('Shared Price je jasno prikazan', () => {
    cy.contains('Tržišna cena akcije (Shared Price)').should('be.visible');
  });

  it('prikazuje ITM ćelije sa zelenom pozadinom', () => {
    cy.contains('h3', 'Opcije').closest('section').find('td')
      .should('have.length.greaterThan', 0)
      .then(($tds) => {
        const green = $tds.filter((_, el) => Cypress.$(el).css('background-color').includes(GREEN));
        expect(green.length).to.be.at.least(1);
      });
  });

  it('prikazuje OTM ćelije sa crvenom pozadinom', () => {
    cy.contains('h3', 'Opcije').closest('section').find('td')
      .should('have.length.greaterThan', 0)
      .then(($tds) => {
        const red = $tds.filter((_, el) => Cypress.$(el).css('background-color').includes(RED));
        expect(red.length).to.be.at.least(1);
      });
  });

  it('legenda prikazuje ITM i OTM oznake', () => {
    cy.contains('In-The-Money').should('be.visible');
    cy.contains('Out-of-Money').should('be.visible');
  });
});
