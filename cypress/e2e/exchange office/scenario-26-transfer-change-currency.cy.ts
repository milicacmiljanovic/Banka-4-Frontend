// cypress/e2e/kt2/scenario-12-transfer-fx-conversion.cy.ts
describe('Scenario 12: Plaćanje u različitim valutama uz konverziju (Transfer prozor)', () => {
    it('sa prvog računa prebacuje na drugi i radi konverziju + proviziju', () => {
        cy.loginAsClient();

        cy.server();
        cy.route('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'RSD 1', currency: 'RSD', balance: 100000 },
                    { account_number: '265-2222222222222-22', name: 'EUR 1', currency: 'EUR', balance: 2000 },
                    { account_number: '265-3333333333333-33', name: 'RSD 2', currency: 'RSD', balance: 50000 },
                ],
            },
        }).as('getAccounts');

        cy.route('POST', '**/clients/*/transfers', {
            statusCode: 201,
            body: {
                message: 'Transfer uspešno izvršen',
                data: {
                    id: 5001,
                    status: 'SUCCESS',
                },
            },
        }).as('createTransfer');

        // Transfer prozor
        cy.visit('/transfers/new');
        cy.wait('@getAccounts');
        cy.location('pathname').should('eq', '/transfers/new');

        // FROM = 1. račun u dropdown-u (posle placeholder-a)
        cy.contains('label', /izvorni račun/i)
            .parent()
            .find('select')
            .as('fromSelect');

        cy.get('@fromSelect').find('option').then(($opts) => {
            // option[0] je "Izaberi račun..."
            expect($opts.length, 'Očekujem bar 2 opcije u FROM select-u (placeholder + 1 račun)').to.be.greaterThan(1);
            const firstAccountValue = $opts[1].getAttribute('value');
            expect(firstAccountValue, 'FROM first account value').to.be.ok;
            cy.get('@fromSelect').select(firstAccountValue!);
        });

        // TO = 2. račun u dropdown-u (posle placeholder-a)
        cy.contains('label', /odredišni račun/i)
            .parent()
            .find('select')
            .as('toSelect');

        cy.get('@toSelect').find('option').then(($opts) => {
            expect($opts.length, 'Očekujem bar 2 opcije u TO select-u (placeholder + 1 račun)').to.be.greaterThan(1);
            const firstValidToAccount = Array.from($opts).map(o => o.getAttribute('value')).find(v => !!v);
            expect(firstValidToAccount, 'TO account value').to.be.ok;
            cy.get('@toSelect').select(firstValidToAccount!);
        });

        // Iznos = 50
        cy.contains('label', /^iznos/i)
            .parent()
            .find('input[type="number"]')
            .clear()
            .type('50');

        // Nastavi (ako dugme nema tekst, ovo neće raditi — vidi napomenu ispod)
        cy.contains('button', /nastavi|dalje/i).click();

        // Potvrda transfera
        cy.location('pathname').should('eq', '/transfers/confirm');

        // Cross-currency očekivanja (ako su valute različite, mora postojati info o kursu/proviziji)
        cy.contains(/kurs|prodajni/i).should('be.visible');
        cy.contains(/proviz/i).should('be.visible');

        // Potvrdi
        cy.contains('button', /potvrdi|izvrši/i).click();

        cy.wait('@createTransfer', { timeout: 20000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 201]);

        // Uspeh
        cy.contains(/uspešno|success/i, { timeout: 20000 }).should('be.visible');
    });
});