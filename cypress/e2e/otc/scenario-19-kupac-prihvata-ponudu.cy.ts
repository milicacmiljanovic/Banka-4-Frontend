describe('Scenario 19: Kupac prihvata ponudu - kreira se opcioni ugovor', () => {
  const TRADING_API_URL = 'http://rafsi.davidovic.io:8082/api';

  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');
    
    // ISPRAVKA: Na slici image_e35896.jpg se vidi da je metoda PATCH
    cy.intercept('PATCH', '**/api/otc/offers/*/accept').as('acceptOffer');
    
    cy.intercept('GET', '**/api/otc/contracts*').as('getContracts');

    cy.loginAsClient(); // Marko Marković
    cy.visit('/otc');
  });

  it('kupac uspešno prihvata ponudu uz izbor računa', () => {
    // 1. Idi na tab Aktivne ponude
    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers');

    // 2. Klik na Detalji za ponudu (Slika image_e35896.jpg)
    cy.get('table tbody tr').first().find('button').contains(/Detalji/i).click();

    // 3. Provera modala
    cy.contains('div', /Ponuda #/i).should('be.visible');

    // 4. IZBOR RAČUNA (Slika Screenshot (419).jpg)
    // Bez ovoga dugme "Prihvati" često ostaje onemogućeno
    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .select(1); 

    // 5. KLIK NA PRIHVATI
    // Na slici image_e35896.jpg vidimo da je ovo dugme pokrenulo PATCH zahtev
    cy.contains('button', /^Prihvati$/i).should('not.be.disabled').click();

    // 6. PROVERA NETWORK TABA (Čekamo PATCH, ne POST)
    cy.wait('@acceptOffer').then((interception) => {
      // Na slici vidimo status 201 (Created) ili 200
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    // 7. POTVRDA PORUKE (Slika image_e35896.jpg pokazuje zelenu potvrdu)
    cy.contains('div', /Ponuda je uspešno prihvaćena/i).should('be.visible');

    // 8. Provera u sklopljenim ugovorima
    cy.contains('button', /Sklopljeni ugovori/i).click({ force: true });
    cy.wait('@getContracts');
    cy.contains('td', 'UFG').should('exist');
  });
});