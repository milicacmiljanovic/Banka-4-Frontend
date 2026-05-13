// Realni korisnik: admin@raf.rs (is_supervisor=true, is_admin=true)
// Realni podaci: 3 javno dostupne UFG akcije na /otc

describe('Scenario 16: Supervizor vidi OTC portal sa ponudama aktuara', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/otc');
  });

  it('supervizor vidi OTC portal i naslov', () => {
    cy.contains('h1', 'OTC Ponude i Ugovori').should('be.visible');
  });

  it('supervizor vidi tab Dostupne akcije sa javnim listingom', () => {
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('supervizor vidi sve tabove portala', () => {
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.contains('button', 'Aktivne ponude').should('be.visible');
    cy.contains('button', 'Sklopljeni ugovori').should('be.visible');
  });

  it('supervizor može kreirati ponudu za pregovor putem dugmeta Pošalji ponudu', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', 'Pošalji ponudu').should('be.visible').and('not.be.disabled');
    });
  });
});
