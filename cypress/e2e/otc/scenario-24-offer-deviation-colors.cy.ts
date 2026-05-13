// Realni korisnik: admin@raf.rs (employee, pristup /otc/ponude)
// Stranica OtcPonudePage uvek prikazuje legendu boja i zaglavlje tabele
// Boje redova: rowGreen=#f0fdf4 (≤5%), rowYellow=#fefce8 (5-20%), rowRed=#fff5f5 (>20%)
// Legenda je uvek vidljiva u card headeru

describe('Scenario 24: Vizualizacija odstupanja u ponudama bojama', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/otc/ponude');
  });

  it('stranica se učitava i prikazuje naslov', () => {
    cy.contains('h1', 'Aktivne ponude').should('be.visible');
  });

  it('legenda boja je vidljiva: zelena za ≤5%', () => {
    cy.contains(/≤5%\s*odstupanje/i).should('be.visible');
  });

  it('legenda boja je vidljiva: žuta za 5-20%', () => {
    cy.contains(/5[–-]20%\s*odstupanje/i).should('be.visible');
  });

  it('legenda boja je vidljiva: crvena za >20%', () => {
    cy.contains(/>20%\s*odstupanje/i).should('be.visible');
  });
});
