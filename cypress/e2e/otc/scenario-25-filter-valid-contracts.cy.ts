// Realni korisnik: marko.markovic@example.com
// Realni ugovori Marka:
//   - ID 7: UFG, status ACTIVE, settlement 2099-12-31 → VAŽEĆI, ima "Iskoristi"
//   - ID 1: UFG, status EXPIRED, settlement 2026-05-12 → ISTEKLI
//   - ID 2-6: status EXERCISED → uvek skriveni

describe('Scenario 25: Filtriranje sklopljenih ugovora po statusu', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/otc');
    cy.contains('button', 'Sklopljeni ugovori').click();
  });

  it('prikazuje filtere Važeći i Istekli ugovori', () => {
    cy.contains('button', 'Važeći ugovori').should('be.visible');
    cy.contains('button', 'Istekli ugovori').should('be.visible');
  });

  it('filter Važeći ugovori prikazuje ugovor sa settlement 2099', () => {
    cy.contains('button', 'Važeći ugovori').click();
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.contains('td', 'UFG').should('be.visible');
  });

  it('za svaki važeći ugovor postoji dugme Iskoristi', () => {
    cy.contains('button', 'Važeći ugovori').click();
    cy.get('table tbody tr', { timeout: 10000 }).each(($row) => {
      cy.wrap($row).contains('button', 'Iskoristi').should('be.visible');
    });
  });

  it('filter Istekli ugovori prikazuje ugovor sa prošlim settlement datumom', () => {
    cy.contains('button', 'Istekli ugovori').click();
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.contains('td', 'UFG').should('be.visible');
  });

  it('istekli ugovori NEMAJU dugme Iskoristi', () => {
    cy.contains('button', 'Istekli ugovori').click();
    cy.get('table tbody', { timeout: 10000 }).within(() => {
      cy.contains('button', 'Iskoristi').should('not.exist');
    });
  });
});
