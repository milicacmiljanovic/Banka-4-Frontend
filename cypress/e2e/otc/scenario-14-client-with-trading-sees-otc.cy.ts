// Realni korisnik: marko.markovic@example.com (ima trading permisiju)
// Realni podaci: 3 javno dostupne UFG akcije (Admin Admin, Marko Markovic, Ana Anic)

describe('Scenario 14: Klijent sa permisijom za trgovinu vidi OTC portal', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/otc');
  });

  it('vidi naslov OTC portala', () => {
    cy.contains('h1', 'OTC Ponude i Ugovori').should('be.visible');
  });

  it('vidi tab Dostupne akcije i tabelu sa podacima', () => {
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('tabela ima sve potrebne kolone', () => {
    cy.get('table thead th', { timeout: 10000 }).then(($ths) => {
      const headers = [...$ths].map(th => th.textContent?.trim().toUpperCase());
      expect(headers).to.include.members(['TICKER', 'NAZIV', 'VLASNIK', 'DOSTUPNO', 'CENA']);
    });
  });

  it('svaka akcija ima ticker UFG i vlasnika', () => {
    cy.get('table tbody tr', { timeout: 10000 }).each(($row) => {
      cy.wrap($row).find('td').eq(0).should('not.be.empty');
      cy.wrap($row).find('td').eq(2).should('not.be.empty');
    });
  });

  it('dugme Pošalji ponudu postoji za svaki red', () => {
    cy.get('table tbody tr', { timeout: 10000 }).each(($row) => {
      cy.wrap($row).contains('button', 'Pošalji ponudu').should('be.visible');
    });
  });
});
