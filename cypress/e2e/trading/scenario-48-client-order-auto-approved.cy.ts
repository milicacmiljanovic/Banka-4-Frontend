describe('Scenario 48: Klijentov order se automatski odobrava', () => {

  it('Klijent preko dashboard-a odlazi na hartije i kreira nalog koji se odmah odobrava', () => {
    // 1. PRESRETANJE (INTERCEPT)
    // Presrećemo portfolio podatke (GET) i slanje ordera (POST)
    cy.intercept('GET', '**/api/portfolio/**').as('loadPortfolio');
    cy.intercept('POST', '**/api/orders/**').as('submitOrder');

    // 2. LOGIN I POČETNA STRANICA
    cy.loginAsClient();
    cy.visit('/dashboard');

    // 3. NAVIGACIJA PREKO NAVBARA
    cy.get('nav').contains(/hartije/i).should('be.visible').click();

    // 4. POTVRDA DA SMO NA PORTFOLIO STRANICI
    // Povećavamo timeout jer rutiranje i GSAP animacija mogu potrajati
  //  cy.url({ timeout: 10000 }).should('include', '/portfolio');

    // Alternativa: Prvo proveri da li se pojavio naslov "Moj Portfolio"
    // pa tek onda proveri URL. To je sigurnije.
   // cy.contains('h1', /moj portfolio/i, { timeout: 10000 }).should('be.visible');

    // Sada čekamo API
    cy.wait('@loadPortfolio');
    // 5. RAD SA TABELOM "HARTIJE OD VREDNOSTI"
    // Tražimo red u kom je neka akcija, npr. Apple (AAPL) ili prva dostupna
    cy.get('table').first().within(() => {
      cy.get('tbody tr').first().within(() => {
        // Klik na tvoje dugme za prodaju koje otvara SellOrderModal
        cy.get('button').contains(/prodaj/i).click({ force: true });
      });
    });

    // 6. POPUNJAVANJE SELLORDERMODAL-A
    // Pošto se modal renderuje uslovno {sellModal && ...}, čekamo ga
    cy.get('input[name="amount"]').should('be.visible').clear().type('10');

    // Klik na dugme za potvrdu unutar modala
    cy.get('button').contains(/^Potvrdi$/i).click();

    // 7. VERIFIKACIJA AUTOMATSKOG ODOBRENJA
    cy.wait('@submitOrder').then((interception) => {
      // Proveravamo da li je status u JSON odgovoru servera 'APPROVED'
      expect(interception.response?.body.status).to.eq('APPROVED');
    });

    // 8. FINALNA PROVERA NA EKRANU
    // Proveravamo da li se pojavila toast poruka ili uspeh
    cy.contains(/uspešno/i).should('be.visible');
  });
});