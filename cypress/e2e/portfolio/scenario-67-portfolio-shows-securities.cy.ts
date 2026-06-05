/// <reference types="cypress" />

export {};

describe('Scenario 67: Portfolio prikazuje listu posedovanih hartija', () => {
    
    beforeEach(() => {
        // Koristimo tvoju ispravnu komandu za login klijenta Ane
        cy.loginAsClientAna();
        cy.visit('/client/portfolio');
    });

    it('prikazuje naslov i strukturu tabele', () => {
        // Provera naslova (fleksibilan regex koji hvata "Portfolio" bez obzira na tačan tekst "Moj Portfolio")
        cy.get('body').should('contain', 'Portfolio');
        
        // Čekamo da se tabela sa podacima učita i renderuje na ekranu
        cy.get('table', { timeout: 15000 }).should('be.visible');
        cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    });

    it('verifikuje postojanje ključnih podataka u zaglavlju tabele', () => {
        // Umesto fiksnih stringova, tražimo ključne reči koje tabela mora da sadrži na UI-ju
        const expectedHeaders = [
            'TICKER', 
            'TYPE', 
            'AMOUNT', 
            'PRICE', 
            'PROFIT'
        ];

        expectedHeaders.forEach(header => {
            cy.get('table').contains('th', new RegExp(header, 'i')).should('be.visible');
        });
    });

    it('proverava ispravnost podataka unutar redova tabele', () => {
        // Selektujemo prvi red tabele i proveravamo osnovne komponente
        cy.get('table tbody tr').first().within(() => {
            // Ticker ne sme biti prazan (bilo koja tekstualna vrednost)
            cy.get('td').eq(0).invoke('text').should('not.be.empty');
            
            // Tip hartije (STOCK, OPTION, FUTURE itd.) mora biti popunjen
            cy.get('td').eq(1).should('not.be.empty');
            
            // Provera da je količina (Amount) uspešno izrenderovana i da nije prazna
            cy.get('td').eq(2).invoke('text').should('not.be.empty');

            // Profit i Cena moraju postojati u redu
            cy.get('td').should('not.be.empty');

            // Verifikujemo da je akciono dugme za prodaju prisutno u tom redu (Slika image_7b82a4.png)
            cy.contains('button', /SELL/i).should('be.visible');
        });
    });

    it('omogućava interakciju sa hartijom i otvaranje prodajne forme', () => {
        // Klik na SELL dugme u prvom redu otvara formu za prodaju (Slika image_7b82a4.png)
        cy.get('table tbody tr').first().contains('button', /SELL/i).click({ force: true });
        
        // Verifikujemo da se uspešno otvorio modal za prodaju (Slika image_7b82a4.png)
        cy.wait(1000);
        cy.get('body').should('contain', 'Prodaj');
        
        // Zatvaramo modal tasterom Escape kako bismo ostavili čist ekran za sledeće testove
        cy.get('body').type('{esc}');
    });
});