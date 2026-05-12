// Realni korisnik: mirko.mirkovic@example.com (NEMA trading permisiju)
// Provera: OTC Portal dugme nije vidljivo u navigaciji

describe('Scenario 15: Klijent bez permisije nema pristup OTC portalu', () => {
  beforeEach(() => {
    cy.loginAsMirko();
    cy.visit('/dashboard');
  });

  it('ne vidi OTC Portal dugme u navigaciji', () => {
    cy.contains('button', 'OTC Portal').should('not.exist');
  });

  it('OTC Portal link nije dostupan u client header navigaciji', () => {
    cy.get('body').should('be.visible');
    cy.contains(/OTC Portal/i).should('not.exist');
  });
});
