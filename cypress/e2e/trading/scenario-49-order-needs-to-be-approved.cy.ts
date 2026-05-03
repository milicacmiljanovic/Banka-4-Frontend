describe('Scenario 49: Protok od klijenta do supervizora', () => {

    it('Klijent kupuje, logout, pa admin proverava supervisor/orders', () => {
        // 1. PRESRETANJE (Mock-ujemo API odgovore)
        cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
        cy.intercept('POST', '**/api/orders/**', (req) => {
            req.reply({ statusCode: 201, body: { status: 'APPROVED' } });
        }).as('submitOrder');

        // 2. LOGIN KAO KLIJENT (ANA)
        cy.loginAsClientAna();
        cy.visit('http://localhost:5173/dashboard');
        cy.visit('http://localhost:5173/client/securities');

        // 3. OTVARANJE MODALA I KUPOVINA
        cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
            cy.contains('button', /Kupi/i).click({ force: true });
        });

        // 4. POPUNJAVANJE FORME U MODALU
        cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {
            // Tip ordera
            cy.contains('label', /Tip ordera/i).parent().find('select').select('MARKET');

            // Račun (čekamo da se učitaju opcije)
            cy.contains('label', /Račun za kupovinu/i).parent().find('select')
                .find('option').should('have.length.at.least', 2);
            cy.contains('label', /Račun za kupovinu/i).parent().find('select').select(1);

            // Količina
            cy.contains('label', /Količina/i).parent().find('input').clear().type('100001');

            // Prelazak na potvrdu
            cy.contains('button', 'Nastavi').click();
        });

        // 5. POTVRDA ORDERA
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('h4', 'Potvrda ordera').should('be.visible');
            cy.contains('button', 'Potvrdi').click();
        });

        // 6. ZATVARANJE MODALA NA "X"
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('button', '✕').click({ force: true });
        });

        // 7. LOGOUT KLIJENTA
        // Ako nemaš dugme, možeš očistiti sesiju da nateraš logout
        cy.visit('http://localhost:5173/dashboard');
        cy.get('nav').then(($nav) => {
            if ($nav.find('button:contains("Logout")').length > 0) {
                cy.contains('button', /Logout|Odjavi se/i).click({ force: true });
            } else {
                // Alternativa: čišćenje storage-a ako dugme nije lako dostupno
                cy.clearLocalStorage();
                cy.clearCookies();
            }
        });

        // 8. LOGIN KAO ADMIN
        cy.visit('http://localhost:5173/login');
        cy.loginAsAdmin();

        // 9. ODLAZAK NA SUPERVISOR STRANICU
        cy.visit('http://localhost:5173/supervisor/orders');

        // 10. VERIFIKACIJA NA ADMIN STRANICI
        // Proveravamo da li se u tabeli vidi order (npr. količina 20)
        cy.get('table', { timeout: 10000 }).should('be.visible');
        cy.contains('td', '20').should('be.visible');
        // Možeš dodati i proveru tickera ako ga znaš
    });
});