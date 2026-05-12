// Realni korisnik: marko.markovic@example.com (kupac, ima 2 aktivne ponude ka Ani - offer 10, 11)
// Ana ima iste ponude kao prodavac
// Ticker: UFG, amount: 1 po ponudi, razlicite cene

describe('Scenario 23: Stranica Aktivne ponude prikazuje sve aktivne pregovore', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/otc');
    cy.contains('button', 'Aktivne ponude').click();
  });

  it('vidi listu aktivnih pregovora', () => {
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('vidi ticker (akciju) za svaki pregovor', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('td').should('not.be.empty');
    });
    cy.contains('td', 'UFG').should('be.visible');
  });

  it('vidi količinu za svaki pregovor', () => {
    cy.contains('tr', 'UFG').within(() => {
      cy.contains('td', '1').should('be.visible');
    });
  });

  it('vidi cenu za svaki pregovor', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('td').contains(/\d+[.,]\d+/).should('be.visible');
    });
  });

  it('vidi settlementDate za svaki pregovor', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('td').contains(/2099|31\.12/).should('be.visible');
    });
  });

  it('vidi s kim pregovara (Prodavac ili Kupac)', () => {
    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.get('td').contains(/Prodavac|Kupac|ID:/).should('be.visible');
    });
  });

  it('svaki pregovor ima dugme Detalji', () => {
    cy.get('table tbody tr', { timeout: 10000 }).each(($row) => {
      cy.wrap($row).contains('button', 'Detalji').should('be.visible');
    });
  });
});
