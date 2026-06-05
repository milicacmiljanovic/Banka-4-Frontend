/// <reference types="cypress" />

export {};

describe('Scenario 73: Kupovina hartije kroz UI i provera u portfoliju (Sa API Rollback-om)', () => {

    const targetTicker = 'CERS';
    let createdOrderId = null; 
    let apiToken = null;

    beforeEach(() => {
        createdOrderId = null;
        
        // 1. UI login preko tvoje komande
        cy.loginAsClientAna();
        
        // 2. Izvlačenje tokena iz aplikacije da izbegnemo mrežne greške
        cy.window().then((win) => {
            const token = win.localStorage.getItem('token') || 
                          win.localStorage.getItem('jwt') || 
                          win.sessionStorage.getItem('token');
            if (token) {
                apiToken = token;
            }
        });
    });

    it('prolazi kroz ceo proces kupovine hartije od vrednosti', () => {
        // Presrećemo POST poziv na trading-service da uhvatimo ID generisanog ordera
        cy.intercept('POST', '**/api/orders').as('createOrderCall');

        cy.visit('/client/securities');
        cy.get('table', { timeout: 10000 }).should('be.visible');
        cy.contains('table tbody tr', targetTicker).click();
        
        // Prevazilaženje CSS overflow-a sa force klikom
        cy.contains('button', 'Kupi').scrollIntoView().click({ force: true });
        cy.wait(1500); 

        // Forma: Izbor računa i količine
        cy.get('select').eq(1).select(1, { force: true }); 
        cy.get('input[type="number"]').first().clear().type('1');
        cy.contains('button', 'Nastavi').click({ force: true });

        // Potvrda ekrana i slanje na backend
        cy.wait(1000); 
        cy.contains('button', 'Potvrdi').click({ force: true });

        // Čekamo mrežni poziv i hvatamo ID
        cy.wait('@createOrderCall', { timeout: 15000 }).then((interception) => {
            // Provera da li je backend odgovorio uspehom (200 ili 201)
            expect(interception.response.statusCode).to.be.within(200, 299);
            
            if (interception.response && interception.response.body) {
                createdOrderId = interception.response.body.id; 
                cy.log(`Uspešno uhvaćen Order ID za rollback: ${createdOrderId}`);
            }

            // OPTIMIZACIJA: Umesto čekanja labilnog toast-teksta, idemo odmah na portfolio
            cy.visit('/client/portfolio');
            
            // Provera da li se kupljeni ticker pojavio u tabeli portfolija
            cy.get('table', { timeout: 15000 }).should('be.visible');
            cy.contains('table tbody tr td', targetTicker).should('be.visible');
        });
    });

    afterEach(() => {
        // Ako test nije stigao da generiše order, preskačemo
        if (!createdOrderId) {
            cy.log('Nema kreiranog Order ID-ja, preskačem API rollback.');
            return;
        }

        const headers: Record<string, string> = {};
        if (apiToken) {
            headers['Authorization'] = apiToken.startsWith('Bearer ') ? apiToken : `Bearer ${apiToken}`;
        }

        // Poništavanje ordera na portu 8082
        cy.request({
            method: 'PATCH', 
            url: `http://127.0.0.1:8082/api/orders/${createdOrderId}/cancel`, 
            headers: headers,
            failOnStatusCode: false
        }).then((res) => {
            cy.log(`Cleanup završen preko API-ja. Status: ${res.status}. Order ${createdOrderId} otkazan.`);
        });
    });
});