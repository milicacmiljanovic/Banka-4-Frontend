
let br =0;
describe('SAGA Pattern - Scenario 10: Duplicate order / idempotency ', () => {
    it('pokuša da pošalje isti SELL order 2x; trenutno oba puta pada na ListingID required', () => {
        cy.intercept('POST', '**/api/orders').as('createOrder');
        cy.intercept('GET', '**/api/transactions/**').as('getTransactionStatus');

        cy.loginAsNikola();
        cy.visit('http://localhost:5173/portfolio');

        // 1) Otvori Sell modal
        cy.get('table tbody tr', { timeout: 20000 })
            .first()
            .within(() => {
                cy.contains(/Sell|Prodaj/i).click({ force: true });
            });

        // 2) Unesi podatke u modalu
        cy.contains('div', /Prodaj/i, { timeout: 20000 })
            .parents()
            .eq(1)
            .within(() => {
                // SAČEKAJ da se select napuni opcijama (async fetch računa)
                cy.get('select')
                    .eq(1)
                    .should('be.visible')
                    .find('option')
                    .should('have.length.greaterThan', 1);

                // Izaberi prvu "pravu" opciju (index 1, jer je index 0 placeholder)
                cy.get('select').eq(1).select(1, { force: true });

                // Unos količine
                cy.get('input')
                    .filter(':visible')
                    .first()
                    .clear({ force: true })
                    .type('1', { force: true });

                cy.contains('button', /^Nastavi$/i).click({ force: true });
            });

        // 3) Potvrdi prodaju (SAGA kreće)
        cy.contains('button', /Potvrdi prodaju/i, { timeout: 20000 })
            .should('be.visible')
            .click({ force: true });

        // 4) Provera da je zahtev poslat
        cy.wait('@createOrder', { timeout: 20000 }).then(({ response }) => {
            expect(response?.statusCode).to.be.oneOf([200, 201, 202]);
            br++;
        });

        cy.visit('http://localhost:5173/portfolio');
        cy.get('table tbody tr', { timeout: 20000 })
            .first()
            .within(() => {
                cy.contains(/Sell|Prodaj/i).click({ force: true });
            });

        // 2) Unesi podatke u modalu
        cy.contains('div', /Prodaj/i, { timeout: 20000 })
            .parents()
            .eq(1)
            .within(() => {
                // SAČEKAJ da se select napuni opcijama (async fetch računa)
                cy.get('select')
                    .eq(1)
                    .should('be.visible')
                    .find('option')
                    .should('have.length.greaterThan', 1);

                // Izaberi prvu "pravu" opciju (index 1, jer je index 0 placeholder)
                cy.get('select').eq(1).select(1, { force: true });

                // Unos količine
                cy.get('input')
                    .filter(':visible')
                    .first()
                    .clear({ force: true })
                    .type('1', { force: true });

                cy.contains('button', /^Nastavi$/i).click({ force: true });
            });

        // 3) Potvrdi prodaju (SAGA kreće)
        cy.contains('button', /Potvrdi prodaju/i, { timeout: 20000 })
            .should('be.visible')
            .click({ force: true });

        cy.wait('@createOrder', { timeout: 20000 }).then(({ response }) => {
            expect(response?.statusCode).to.be.oneOf([200, 201, 202]);
        });

    });

});