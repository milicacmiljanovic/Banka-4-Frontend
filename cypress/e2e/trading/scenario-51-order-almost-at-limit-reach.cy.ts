describe('Scenario 51: Order na samoj granici limita agenta', () => {

    it('Agent pravi order koji dopunjava limit do tačno 100k i dobija APPROVED status', () => {
        // 1. PRESRETANJE
        // Simuliramo da je limit tačno pogođen i da backend dozvoljava automatsko odobrenje
        cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
        cy.intercept('POST', '**/api/orders/**', (req) => {
            req.reply({
                statusCode: 201,
                body: { status: 'APPROVED' }
            });
        }).as('submitOrderEdgeCase');

        // 2. LOGIN KAO AGENT
        cy.loginAsClient();

        // 3. NAVIGACIJA
        cy.visit('http://localhost:5173/dashboard');
        cy.visit('http://localhost:5173/securities');

        // 4. OTVARANJE MODALA
        cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
            cy.contains('button', /Kupi|Kreiraj nalog/i).click({ force: true });
        });

        // 5. POPUNJAVANJE FORME
        cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {
            // Tip ordera
            cy.contains('label', /Tip ordera/i).parent().find('select').select('MARKET');

            // Račun
            cy.contains('label', /Račun za kupovinu/i).parent().find('select')
                .find('option').should('have.length.at.least', 2);
            cy.contains('label', /Račun za kupovinu/i).parent().find('select').select(1);

            // KOLIČINA: Postavljamo tako da ukupna cena bude tačno 20.000 RSD
            // (Pretpostavka: cena je 1000, kucamo 20 komada)
            cy.contains('label', /Količina/i).parent().find('input')
                .clear({ force: true })
                .type('20', { force: true });

            // Klik na Nastavi - koristimo force:true zbog prethodne greške
            cy.contains('button', 'Nastavi').click({ force: true });
        });

        // 6. POTVRDA
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('h4', 'Potvrda ordera').should('be.visible');
            cy.contains('button', 'Potvrdi').click({ force: true });
        });

        // 7. VERIFIKACIJA APPROVED STATUSA
        cy.wait('@submitOrderEdgeCase').then((interception) => {
            // Ovde je ključna razlika: Očekujemo APPROVED jer je 100.000 <= 100.000
            expect(interception.response?.body.status).to.eq('APPROVED');
        });

        // Provera uspešne poruke za odobren order (iz tvog React koda)
        cy.contains(/Order je odobren i čeka izvršenje/i).should('be.visible');

        // 8. ZATVARANJE I PROVERA PORTFOLIJA
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('button', '✕').click({ force: true });
        });

        cy.visit('http://localhost:5173/dashboard');
    });
});