describe('Scenario 32: Pokusaj aktivacije deaktivirane kartice', () => {
    it('sistem ne dozvoljava aktivaciju deaktivirane kartice', () => {
        cy.loginAsClient();

        cy.server();
        cy.route('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1234567890123-45', name: 'Tekuci RSD', currency: 'RSD' },
                ],
            },
        }).as('getAccounts');

        cy.route('GET', '**/clients/*/accounts/265-1234567890123-45/cards*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 7701,
                        card_number: '4000123412349999',
                        status: 'DEACTIVATED',
                        card_type: 'DEBIT',
                        expiration_date: '2028-08-01T00:00:00Z',
                    },
                ],
            },
        }).as('getCards');

        cy.visit('/client/cards');
        cy.wait('@getAccounts');
        cy.wait('@getCards');

        cy.contains('button', /detalji kartice/i).click({ force: true });
        cy.contains(/trajno deaktivirana|ne mo.e se ponovo aktivirati/i).should('be.visible');
        cy.contains('button', /aktiviraj/i).should('not.exist');
    });
});
