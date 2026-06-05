/// <reference types="cypress" />

export {};

describe('Scenario 37: Korisnik ne može prodati više hartija nego što poseduje', () => {
    
    beforeEach(() => {
        // Koristimo ispravnu komandu za login
        cy.loginAsClientAna();
        cy.visit('/client/portfolio');
    });

    it('validacija količine: onemogućava nastavak kada se unese prevelik iznos', () => {
        cy.get('table', { timeout: 10000 }).should('be.visible');

        // Selektujemo prvi red da bismo pokrenuli prodaju
        cy.get('table tbody tr').first().then(($row) => {
            // Čitamo količinu iz treće kolone (indeks 2)
            const ownedAmountText = $row.find('td').eq(2).text().trim();
            const ownedAmount = parseFloat(ownedAmountText) || 1; // Ako je prazno, fallback na 1
            const tooMuch = ownedAmount + 5; // Unosimo garantovano veću količinu

            // Klik na SELL dugme za tu hartiju
            cy.wrap($row).find('button').contains('SELL').click({ force: true });
            cy.wait(1000);

            // Selektujemo račun (indeks 1) jer bez njega forma nije validna (Slika image_7b82a4.png)
            cy.get('select').eq(1).should('not.contain', 'Učitavanje...');
            cy.get('select').eq(1).select(1, { force: true });

            // Hvata se input polje za količinu i upisuje prevelika vrednost
            cy.get('input[type="number"]').first()
                .should('be.visible')
                .clear({ force: true })
                .type(tooMuch.toString(), { force: true });

            // 1. Provera: Dugme 'Nastavi' treba da bude disabled ili klik ne sme da prođe
            // (Zavisno od implementacije: ili je HTML disabled, ili se pojavljuje tekstualna greška)
            cy.contains('button', /Nastavi/i).then(($btn) => {
                if ($btn.is(':disabled')) {
                    cy.wrap($btn).should('be.disabled');
                } else {
                    // Ako dugme tehnički nije disabled, klik na njega ne sme da promeni ekran u "Potvrda"
                    cy.wrap($btn).click({ force: true });
                    cy.contains('Potvrda ordera').should('not.exist');
                }
            });
        });

        // Zatvaramo modal da očistimo ekran
        cy.get('body').type('{esc}');
    });

    it('forma ne prelazi na potvrdu čak i uz forsirani klik sa ekstremnom količinom', () => {
        cy.get('table', { timeout: 10000 }).should('be.visible');
        cy.contains('button', 'SELL').first().click({ force: true });
        cy.wait(1000);

        // Izbor računa (Slika image_7b82a4.png)
        cy.get('select').eq(1).should('not.contain', 'Učitavanje...');
        cy.get('select').eq(1).select(1, { force: true });

        // Unos nerealno velike količine
        cy.get('input[type="number"]').first().clear({ force: true }).type('9999999', { force: true });

        // Pokušaj forsiranog prelaska dalje
        cy.contains('button', /Nastavi/i).click({ force: true });

        // Ekran za potvrdu (Slika image_7bf301.png) ne sme da se pojavi
        cy.contains('Potvrda ordera').should('not.exist');

        // Zatvaramo modal na kraju
        cy.get('body').type('{esc}');
    });
});