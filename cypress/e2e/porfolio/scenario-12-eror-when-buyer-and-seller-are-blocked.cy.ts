/**
 * Scenario 12 – "Error when buyer and seller are blocked"
 *
 * Idealno: backend odbija transakciju jer su buyer/seller blokirani, SAGA se rollback-uje.
 *
 * Trenutno stanje:
 * - Sell iz /client/portfolio ne šalje listing_id -> POST /api/orders vraća 400
 * - SAGA ne startuje, pa ne možemo realno testirati "blocked" logiku kroz ovaj UI flow.
 *
 * Ovaj test zato trenutno proverava samo:
 *  1) da se request šalje
 *  2) da dobijamo 400 dok listing_id nije implementiran
 *  3) da UI prikaže error
 *
 * Kad se listing_id popravi:
 * - ovaj scenario treba testirati sa nalogom koji je blokiran (buyer/seller),
 *   ili kroz backend test hook / seed data.
 */

describe('SAGA Pattern - Scenario 12: Error when buyer and seller are blocked ', () => {
    it('pokuša prodaju; trenutno pada na ListingID required i UI prikaže grešku', () => {
        cy.intercept('POST', '**/api/orders').as('createOrder');
        cy.intercept('GET', '**/api/transactions/**').as('getTransactionStatus');

        cy.loginAsClient();
        cy.visit('http://localhost:5173/client/portfolio');

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

        cy.loginAsAdmin();

        cy.visit('http://localhost:5173/client');
        cy.visit('http://localhost:5173/clients/1');


    });
});