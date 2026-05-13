describe('Scenario 17: Kupac inicira pregovor sa prodavcem', () => {
  
  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/public*').as('getListings');
    cy.intercept('POST', '**/api/otc/offers*').as('createOffer');
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');

    cy.loginAsClient(); 
    cy.visit('/otc');
  });

  it('uspešno inicira pregovor popunjavanjem Make an Offer forme', () => {
    cy.get('table', { timeout: 15000 }).should('be.visible');

    // CILJAMO RED GDE JE VLASNIK ANA ANIĆ
    cy.contains('tr', 'Ana Anic') // Pronalazi red koji sadrži tekst "Ana Anić"
      .find('button')            // U tom redu traži dugme
      .contains(/Pošalji ponudu/i)
      .click({ force: true });

    cy.get('.modal').should('be.visible');

    // TVOJI PODACI
    cy.contains('.label', /Volume/i).find('input').clear().type('1');
    cy.contains('.label', /Price Offer/i).find('input').clear().type('0.50');
    
    // Datum: 18. Maj 2026.
    cy.get('input[type="date"]').clear().type('2026-05-18');

    // Premium: 0.10
    // VAŽNO: Ako i dalje dobijaš 400 (kao na slici), proveri ključ u React kodu (premiumRSD)
    cy.contains('.label', /Premium/i).find('input').clear().type('0.10');

    // IZBOR RAČUNA
    cy.get('select.input').select(1);

    // SLANJE
    cy.get('.submitBtn').click();

    // PROVERA ODGOVORA
    cy.wait('@createOffer').then((interception) => {
      // Ako je status 400, to je do React koda i ključa premiumRSD
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });
  });

  it('prikazuje novu ponudu u tabu Aktivne ponude', () => {
    cy.contains('button', /Aktivne/i).click({ force: true });
    cy.wait('@getOffers', { timeout: 10000 });
    cy.get('table').should('be.visible');
  });
});