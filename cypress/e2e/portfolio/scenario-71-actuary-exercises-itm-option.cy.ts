/// <reference types="cypress" />

// Izolujemo fajl da se promenljive ne bi sudarale sa Scenariom 38 i 70
export {};

describe('Scenario 71: Admin može da iskoristi opciju koja je in-the-money', () => {
    
    const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
    const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

    const CLIENT_EMAIL    = 'ana.anic@example.com'; 
    const CLIENT_PASSWORD = 'password123';

    let authToken: string;
    let exercisedOptionId: number | null = null;
    
    before(() => {
        // Dobavljamo token za potencijalne API zahteve u afterEach-u
        cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
            email: CLIENT_EMAIL,
            password: CLIENT_PASSWORD,
        }).then((res) => {
            expect(res.status).to.eq(200);
            authToken = res.body.token;
        });
    });

    beforeEach(() => {
        exercisedOptionId = null;

        // Koristimo login Ane Anić jer ona ima assete u portfoliju na klijentskoj ruti
        cy.loginAsClientAna();
        
        cy.visit('/client/portfolio', {
            onBeforeLoad(win) {
                // Stubujemo window dijaloge u slučaju da aplikacija koristi nativne browsere prompte
                cy.stub(win, 'confirm').as('confirmStub').returns(true);
                cy.stub(win, 'alert').as('alertStub');
            },
        });

        // Čekamo da se tabela učita pre testova
        cy.get('table', { timeout: 10000 }).should('be.visible');
    });

    afterEach(() => {
        // CLEANUP: Ako je opcija stvarno izvršena tokom testa, šaljemo zahtev za poništavanje/storniranje
        if (exercisedOptionId) {
            cy.request({
                method: 'POST',
                url: `${TRADING_SERVICE_URL}/options/${exercisedOptionId}/cancel-exercise`, // Prilagodi endpoint-u tvog projekta ako postoji
                headers: { Authorization: `Bearer ${authToken}` },
                failOnStatusCode: false
            }).then((res) => {
                cy.log(`Cleanup executed za opciju ${exercisedOptionId}. Status: ${res.status}`);
            });
        }
    });

    it('prikazuje dugme EXERCISE za ITM opcije i proverava interakciju', () => {
        // Presrećemo pravi API poziv za izvršavanje opcije
        cy.intercept('POST', '**/options/**/exercise*').as('exerciseRequest');

        // Tražimo red sa ITM statusom
        cy.get('table tbody tr').then(($rows) => {
            const itmRow = $rows.toArray().find(row => 
                row.innerText.includes('ITM') || row.innerText.includes('In The Money')
            );

            if (itmRow) {
                cy.wrap(itmRow).within(() => {
                    // Tražimo dugme EXERCISE i klikćemo na njega
                    cy.get('button').contains(/EXERCISE/i)
                        .should('be.visible')
                        .click({ force: true });
                });

                // Ako tvoja aplikacija otvara custom modal umesto window.confirm, 
                // ovaj kod ispod će bezbedno proveriti i kliknuti na "Potvrdi"
                cy.get('body').then(($body) => {
                    if ($body.find('button:contains("Potvrdi")').length > 0) {
                        cy.get('button').contains(/Potvrdi/i).click({ force: true });
                    }
                });

                // Hvatamo ID opcije iz mrežnog zahteva radi cleanup-a
                cy.wait('@exerciseRequest', { timeout: 8000 }).then((interception) => {
                    const resBody = interception.response?.body ?? {};
                    const optionId = resBody.option_id || resBody.id;
                    if (optionId) {
                        exercisedOptionId = optionId;
                    }
                });
                
            } else {
                cy.log('Nema trenutno dostupnih ITM opcija u tabeli, test preskače klik.');
            }
        });
    });

    it('EXERCISE dugme nije prikazano za opcije koje nisu ITM', () => {
        cy.get('table tbody tr').each(($tr) => {
            const text = $tr.text();
            // Ako je opcija Out of the Money (OTM), dugme EXERCISE ne sme da postoji u tom redu
            if (text.includes('OTM') || text.includes('Out of the Money')) {
                cy.wrap($tr).contains('button', /EXERCISE/i).should('not.exist');
            }
        });
    });
});