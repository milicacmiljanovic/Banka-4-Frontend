describe('Scenario 19: Kupac prihvata ponudu - kreira se opcioni ugovor', () => {
  const TRADING_API_URL = 'http://rafsi.davidovic.io:8082/api';

  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');
    
    cy.intercept('PATCH', '**/api/otc/offers/*/accept').as('acceptOffer');
    
    cy.intercept('GET', '**/api/otc/contracts*').as('getContracts');

    cy.loginAsClient(); // Marko Marković
    cy.visit('/otc');
  });
it('kupac uspešno prihvata ponudu uz izbor računa', () => {
    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers');

    // Klik na Detalji prve ponude u tabeli
    cy.get('table tbody tr').first().find('button').contains(/Detalji/i).click();

    // PROVERA PODATAKA (umesto kucanja)
    // Na slici image_76f026.jpg vidimo da su ovo statični podaci
    cy.contains('div', /Amount:/i).should('exist');
    cy.contains('div', /Price per stock:/i).should('exist');
    cy.contains('div', /Premium:/i).should('exist');

    // IZBOR RAČUNA (Ovo je jedino polje za unos na slici)
    // Koristimo vrednost "5" jer je to tvoj definisani testni parametar za ID pozicije
    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .select(1); 

    // KLIK NA PRIHVATI
    // Dugme mora biti omogućeno nakon izbora računa
    cy.contains('button', /^Prihvati$/i).should('not.be.disabled').click();

    // Potvrda PATCH zahteva
    cy.wait('@acceptOffer').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains('div', /Ponuda je uspešno prihvaćena/i).should('be.visible');
});
});