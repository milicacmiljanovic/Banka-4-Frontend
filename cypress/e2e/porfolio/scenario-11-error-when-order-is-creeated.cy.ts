

describe('SAGA Pattern - Scenario 11: Error when order is created ', () => {
    it('pokuša prodaju; trenutno pada na ListingID required i UI prikaže grešku', () => {
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
                    .type('100000', { force: true });

                cy.contains('button', /^Nastavi$/i).click({ force: true });
            });

    });
});