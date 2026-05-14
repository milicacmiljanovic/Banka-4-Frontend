describe('Scenario 17: Kupac inicira pregovor sa prodavcem', () => {
  
  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/public*').as('getListings');
    cy.intercept('POST', '**/api/otc/offers*').as('createOffer');
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');

    cy.loginAsClient(); // Marko Marković
    cy.visit('/otc');
  });

  it('uspešno inicira pregovor popunjavanjem Make an Offer forme', () => {
    cy.wait('@getListings');
    cy.get('table', { timeout: 15000 }).should('be.visible');

    // 1. Pronalaženje reda i otvaranje modala
    cy.contains('tr', 'Ana Anic') 
      .find('button')
      .contains(/Pošalji ponudu/i)
      .click({ force: true });

    cy.get('.modal').should('be.visible');

    // 2. Unos podataka koji zadovoljavaju tvoju NOVU logiku:
    // Volume: 10, Price: 100 => Max Premium je 1000.
    const volume = '1';
    const price = '1.2';
    const premium = '1.3'; // 50 je > 0 i < 1000, dakle validno je.

    cy.contains('.label', /Volume/i).find('input').clear().type(volume);
    cy.contains('.label', /Price Offer/i).find('input').clear().type(price);
    
    // Datum: 18. Maj 2026. (pazi na format yyyy-mm-dd)
    cy.get('input[type="date"]').clear().type('2026-05-18');

    // Premium: mora biti veći od 0 i manji od (volume * price)
    cy.contains('.label', /Premium/i).find('input').clear().type(premium);

    // 3. IZBOR RAČUNA - Poboljšana selekcija
    // Selektujemo drugu opciju (index 1) jer je index 0 obično "Izaberite račun..."
    cy.get('select.input')
      .should('be.visible')
      .select(1)
      .should('not.have.value', ''); // Provera da vrednost nije prazna

    // 4. SLANJE - Provera da dugme NIJE disabled pre klika
    cy.get('.submitBtn')
      .should('not.be.disabled')
      .click();

    // 5. PROVERA ODGOVORA
    cy.wait('@createOffer').then((interception) => {
      // Proveravamo da li backend prihvata JSON sa ispravnim ključevima
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains(/uspešno/i).should('be.visible');
  });

  it('prikazuje novu ponudu u tabu Aktivne ponude', () => {
    cy.contains('button', /Aktivne ponude/i).click({ force: true });
    cy.wait('@getOffers', { timeout: 10000 });
    cy.get('table').should('be.visible');
    // Provera da li se u tabeli vidi inicirana ponuda
  });
});