describe('Scenario 50: Agentov order ide na odobravanje zbog dnevnog limita', () => {

    it('Agent pravi order koji prelazi dnevni limit i status ostaje PENDING', () => {
        // 1. PRESRETANJE (Simuliramo da je limit probijen i backend vraća PENDING)
        cy.intercept('GET', '**/api/accounts/**').as('getAccounts');
        cy.intercept('POST', '**/api/orders/**', (req) => {
            req.reply({
                statusCode: 201,
                body: { status: 'PENDING', message: 'Daily limit exceeded' }
            });
        }).as('submitOrderLimit');

        // 2. LOGIN KAO AGENT
        cy.loginAsAdmin();

        // 3. ODLAZAK NA DASHBOARD PA NA SECURITIES
        cy.visit('http://localhost:5173/dashboard');
        cy.visit('http://localhost:5173/securities');

        // 4. OTVARANJE MODALA ZA KUPOVINU
        cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
            cy.contains('button', /Kupi|Kreiraj nalog/i).click({ force: true });
        });

        // 5. POPUNJAVANJE FORME (Gledajući tvoj React kod)
        cy.get('[class*="modalOverlay"]').should('be.visible').within(() => {

            // TIP ORDERA
            cy.contains('label', /Tip ordera/i).parent().find('select').select('MARKET');

            // RAČUN (Čekamo opcije)
            cy.contains('label', /Račun za kupovinu/i).parent().find('select')
                .find('option').should('have.length.at.least', 2);
            cy.contains('label', /Račun za kupovinu/i).parent().find('select').select(1);

            // KOLIČINA (Unosimo 20 komada da simuliramo cenu od 20.000 RSD)
            cy.contains('label', /Količina/i).parent().find('input')
                .clear()
                .type('20');

            // NASTAVI
// Koristimo direktan klik bez 'should(be.visible)' jer animacija možda kasni par milisekundi
            cy.contains('button', 'Nastavi').click({ force: true });        });

        // 6. POTVRDA NA DRUGOM EKRANU
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('h4', 'Potvrda ordera').should('be.visible');
            cy.contains('button', 'Potvrdi').click();
        });

        // 7. VERIFIKACIJA PENDING STATUSA
        cy.wait('@submitOrderLimit').then((interception) => {
            expect(interception.response?.body.status).to.eq('PENDING');
        });

        // Provera poruke o čekanju odobrenja (tvoj successBanner)
        cy.contains(/čeka odobrenje/i).should('be.visible');

        // 8. ZATVARANJE I ODJAVA
        cy.get('[class*="modalOverlay"]').within(() => {
            cy.contains('button', '✕').click({ force: true });
        });

        // Odlazak na dashboard za kraj
        cy.visit('http://localhost:5173/dashboard');
    });
});