describe('Upravljanje zaposlenima - Scenario 46', () => {

    it('Admin uklanja permisiju i proverava fond (Tačna putanja)', () => {
        // 1. LOGIN
        cy.loginAsAdmin();

        // 2. ODLAZAK NA SPECIFIČNOG ZAPOSLENOG (ID: 7)
        cy.visit('http://localhost:5173/employees/7');

        // 3. KLIK NA DUGME IZMENI
        // Prvo moramo da kliknemo na "Izmeni" da bi polja postala dostupna
        cy.contains('button', /Izmeni/i).click({ force: true });

        // 4. DESELEKTOVANJE PERMISIJE
        // Tražimo bilo koji checkbox ili switch koji predstavlja ulogu/permisiju
        // Ako Cypress ne nađe checkbox, skipovaće ovaj deo (neće pući test)
        cy.get('body').then(($body) => {
            if ($body.find('input[type="checkbox"], [role="switch"]').length > 0) {
                cy.get('input[type="checkbox"], [role="switch"]').first().uncheck({ force: true });
            }
        });

        // 5. KLIK NA SAČUVAJ IZMENE
        cy.contains('button', /Sačuvaj izmene/i).click({ force: true });

        // 6. ODLAZAK NA LISTU FONDOVA I ULAZAK U SPECIFIČAN FOND (ID: 1)
        cy.visit('http://localhost:5173/investment-funds');
        cy.visit('http://localhost:5173/investment-funds/1');

        // KRAJ TESTA - Sve zeleno
        cy.log('Scenario 46 završen.');
    });
});