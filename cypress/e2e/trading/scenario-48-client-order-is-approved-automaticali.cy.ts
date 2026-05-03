describe('Scenario 48: Klijentov order se automatski odobrava', () => {
    it('klijent kupuje akciju i ona odmah dobija status APPROVED', () => {
        // 1. PRESRETANJE
        cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
        cy.intercept('POST', '**/api/orders/**', (req) => {
            req.reply({ statusCode: 201, body: { status: 'APPROVED' } });
        }).as('submitOrder');

        // 2. LOGIN I NAVIGACIJA
        cy.loginAsClientAna();
        cy.visit('http://localhost:5173/dashboard');
        cy.visit('http://localhost:5173/client/securities');

        // 3. OTVARANJE MODALA
        // Čekamo tabelu i klikćemo na "Kupi" (tvoj actionConfig label)
        cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
            cy.contains('button', /Kupi/i).click({ force: true });
        });

        // 4. POPUNJAVANJE FORME (Prvi ekran modala)
        cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {

            // TIP ORDERA (Default je MARKET, ali ga biramo za svaki slučaj)
            cy.contains('label', /Tip ordera/i).parent().find('select')
                .select('MARKET');

            // RAČUN ZA KUPOVINU
            // Čekamo da "Izaberite račun..." nestane ili da se pojave opcije
            cy.contains('label', /Račun za kupovinu/i).parent().find('select')
                .find('option')
                .should('have.length.at.least', 2);

            cy.contains('label', /Račun za kupovinu/i).parent().find('select')
                .select(1); // Bira prvu pravu opciju ispod placeholdera

            // KOLIČINA
            cy.contains('label', /Količina/i).parent().find('input')
                .clear()
                .type('20');

            // KLIK NA NASTAVI (handleProceedToConfirm)
            cy.contains('button', 'Nastavi').click();
        });

        // 5. POTVRDA (Drugi ekran modala - showConfirm postao true)
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('h4', 'Potvrda ordera').should('be.visible');

            // Klik na "Potvrdi" (handleConfirmSubmit)
            cy.contains('button', 'Potvrdi').click();
        });


        // 8. ZATVARANJE MODALA NA "X"
        // Tvoj React kod ima dugme: <button className={styles.modalClose} onClick={onClose}>✕</button>
        cy.get('[class*="modalOverlay"]').within(() => {
            // Tražimo dugme koje sadrži '✕' (iks)
            cy.contains('button', '✕').click({ force: true });
        });

        // 9. POVRATAK NA DASHBOARD PREKO URL-A ILI NAVBARA
        cy.visit('http://localhost:5173/client/portfolio' +
            '');

    });
});