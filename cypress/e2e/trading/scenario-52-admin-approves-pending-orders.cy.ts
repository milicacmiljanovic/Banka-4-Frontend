describe('Scenario 52: Supervizor odobrava pending order', () => {

    it('Supervizor pronalazi PENDING order, odobrava ga i proverava metapodatke', () => {
        // 1. PRESRETANJE (Mock-ujemo listu ordera i samu akciju odobravanja)
        // Simuliramo da postoji jedan PENDING order u listi
        cy.intercept('GET', '**/api/orders/pending', {
            statusCode: 200,
            body: [
                {
                    id: 123,
                    ticker: 'AAPL',
                    quantity: 20,
                    status: 'PENDING',
                    orderType: 'MARKET',
                    createdBy: 'Agent Marko'
                }
            ]
        }).as('getPendingOrders');

        // Simuliramo uspeh nakon klika na Approve
        cy.intercept('POST', '**/api/orders/123/approve', {
            statusCode: 200,
            body: {
                id: 123,
                status: 'APPROVED',
                approvedBy: 'Supervizor Goran'
            }
        }).as('approveAction');

        // 2. LOGIN KAO SUPERVIZOR
        cy.loginAsAdmin();

        // 3. ODLAZAK NA STRANICU ZA ODOBRAVANJE
        cy.visit('http://localhost:5173/supervisor/orders');
        cy.wait('@getPendingOrders');

        // 4. PRONALAŽENJE I ODOBRAVANJE ORDERA
        // Tražimo red u tabeli koji ima status PENDING
        cy.get('table tbody tr').first().within(() => {
            cy.contains('AAPL').should('be.visible');
            cy.contains('PENDING').should('be.visible');

            // Klik na dugme "Approve" (Prilagodi naziv dugmeta ako je na srpskom npr. "Odobri")
            cy.contains('button', /Approve|Odobri/i).click({ force: true });
        });

        // 5. POTVRDA AKCIJE (Ako postoji dodatni modal za potvrdu)
        // Mnogi sistemi traže "Da li ste sigurni?", ako tvoj nema, preskoči ovaj deo
        cy.get('body').then(($body) => {
            if ($body.find('[class*="modal"]').length > 0) {
                cy.contains('button', /Confirm|Potvrdi/i).click({ force: true });
            }
        });

        // 6. VERIFIKACIJA PROMENE
        cy.wait('@approveAction');

        // Proveravamo da li je status u tabeli sada promenjen u APPROVED
        cy.get('table tbody tr').first().within(() => {
            cy.contains(/APPROVED/i).should('be.visible');

            // Provera da li je polje "Approved By" popunjeno (ako je vidljivo u tabeli)
            // Ako nije u tabeli, možeš proveriti u detaljima ili presresti odgovor
            cy.contains('Supervizor Goran').should('be.visible');
        });

        // 7. PORUKA O USPEHU
        cy.contains(/Order uspešno odobren/i).should('be.visible');
    });
});