describe('Scenario 18: Prodavac šalje protivponudu', () => {
  // Port 8082 se koristi za OTC Trading API
  const TRADING_API_URL = 'http://rafsi.davidovic.io:8082/api';

  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');
    
    // ISPRAVKA: Na slici 424 se vidi da je metoda PUT i endpoint se završava na /counter
    cy.intercept('PUT', '**/api/otc/offers/*/counter').as('sendCounterOffer');
    
    cy.intercept('GET', '**/api/clients/*/accounts').as('getAccounts');
    
    cy.loginAsClientAna(); // Ana Anić
    cy.visit('/otc');
  });

  it('uspešno bira račun i šalje protivponudu sa izmenjenim uslovima', () => {
    // 1. Idi na tab Aktivne ponude
    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers');

    // 2. Klik na Detalji za prvu ponudu u tabeli
    cy.get('table tbody tr').first().find('button').contains(/Detalji/i).click();
    
    // 3. Provera da li je modal otvoren
    cy.contains('h2, h3, div', /Ponuda #/i, { timeout: 10000 }).should('be.visible');

    // 4. Izbor računa za naplatu (mora pre klika na Kontraponuda)
    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .select(1); 

    // 5. Otvaranje forme za kontraponudu
    cy.contains('button', /^Kontraponuda$/i).click({ force: true });

    // 6. Popunjavanje uslova (Cena 0.52)
    cy.contains('label', /Price per stock/i, { timeout: 5000 })
      .parent()
      .find('input')
      .should('be.visible')
      .clear()
      .type('0.52', { delay: 100 });
    
    cy.contains('label', /Premium/i)
      .parent()
      .find('input')
      .clear()
      .type('0.1', { delay: 100 });

    // 7. Slanje kontraponude
    cy.contains('button', /Pošalji kontraponudu/i).click();

    // 8. Provera mrežnog zahteva (PUT umesto POST)
    cy.wait('@sendCounterOffer').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      // Provera da li je cena ispravno poslata u payload-u
      expect(interception.request.body.price_per_stock_rsd).to.eq(0.52);
    });

    // 9. Potvrda na UI-ju (Zelena poruka se vidi na slici 424)
    cy.contains('div', /Kontraponuda je uspešno poslata/i).should('be.visible');
  });
});