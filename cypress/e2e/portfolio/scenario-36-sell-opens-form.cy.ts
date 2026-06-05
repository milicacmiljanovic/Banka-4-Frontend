/// <reference types="cypress" />

export {};

describe('Scenario 36: SELL order iz portfolija otvara formu za prodaju', () => {
    
    beforeEach(() => {
        // Koristimo ispravnu komandu koja vrši pravi login i postavlja sesiju
        cy.loginAsClientAna();
        
        // Odlazimo direktno na stranicu portfolija
        cy.visit('/client/portfolio');
    });

    it('klik na SELL otvara modal sa SELL formom', () => {
        // Čekamo da se tabela učita sa stvarnim podacima
        cy.get('table', { timeout: 10000 }).should('be.visible');

        // Klik na prvo dostupno SELL dugme u tabeli
        cy.contains('button', 'SELL').first().should('be.visible').click({ force: true });

        // Provera da li modal sadrži naslov za prodaju (Slika image_7b82a4.png)
        cy.contains(/Prodaj —|Sell —/i).should('be.visible');

        // Zatvaramo modal da ne smeta sledećem testu
        cy.get('body').type('{esc}');
    });

    it('forma sadrži polje za unos količine', () => {
        cy.contains('button', 'SELL').first().click({ force: true });

        // Provera postojanja input polja za količinu (Slika image_7b82a4.png)
        cy.get('input[type="number"]').first().should('exist');

        // Zatvaramo modal
        cy.get('body').type('{esc}');
    });

    it('unos validne količine i izbor računa omogućava korak za potvrdu', () => {
        // 1. Otvori modal
        cy.contains('button', 'SELL').first().click({ force: true });
        cy.wait(1000);

        // 2. Selektuj račun (Slika image_7b82a4.png)
        // Tip Ordera (indeks 0) NE MENJAMO (ostaje Market). 
        // Biramo račun u drugom dropdown-u (indeks 1) i čekamo da prođe učitavanje.
        cy.get('select').eq(1).should('not.contain', 'Učitavanje...');
        cy.get('select').eq(1).select(1, { force: true }); 

        // 3. Unesi količinu 1 (Slika image_7b82a4.png)
        cy.get('input[type="number"]').first().should('be.visible').clear({ force: true }).type('1');

        // 4. Klikni na crveno dugme "Nastavi" (Slika image_7b82a4.png)
        cy.contains('button', /Nastavi/i).should('be.visible').click({ force: true });

        // 5. Provera naslova ekrana za potvrdu (Slika image_7bf301.png)
        cy.wait(1000);
        cy.contains(/Potvrda/i).should('be.visible');
        
        // Provera dugmeta za finalnu potvrdu
        cy.contains('button', /Potvrdi/i).should('be.visible');

        // Opciono: Ako želiš samo da prooveriš formu bez stvarnog izvršavanja prodaje,
        // ovde zatvaramo modal sa ESC kako test ne bi menjao stanje u bazi svaki put.
        cy.get('body').type('{esc}');
    });
});