describe('Scenario 33: Klijent podnosi zahtev za kredit', () => {
    it('otvara formu i salje validan zahtev', () => {
        cy.loginAsClient();

        cy.server();
        cy.route('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'Tekuci RSD', currency: 'RSD', balance: 200000 },
                ],
            },
        }).as('getAccounts');

        cy.route('GET', '**/clients/*/loans*', {
            statusCode: 200,
            body: { data: [] },
        }).as('getLoans');

        cy.route('POST', '**/clients/*/loans/request', {
            statusCode: 201,
            body: {
                message: 'Zahtev je uspesno podnet i ceka odobrenje.',
                data: { id: 9001, status: 'PENDING' },
            },
        }).as('createLoanRequest');

        cy.visit('/client/loans');
        cy.wait('@getLoans');
        cy.wait('@getAccounts');

        cy.contains('button', /novi zahtev/i).click({ force: true });
        cy.contains('label', /vrsta kredita/i).parent().find('select').select('AUTO');
        cy.contains('label', /valuta kredita/i).parent().find('select').select('RSD');
        cy.contains('label', /ra.un za kredit/i).parent().find('select').select('265-1111111111111-11');
        cy.contains('label', /plata/i).parent().find('input').clear().type('120000');
        cy.contains('label', /status zaposlenja/i).parent().find('select').select('stalno');
        cy.contains('label', /.eljeni iznos/i).parent().find('input').clear().type('250000');
        cy.contains('label', /broj rata/i).parent().find('input').clear().type('48');

        cy.contains('button', /podnesi zahtev/i).click({ force: true });
        cy.wait('@createLoanRequest').its('response.statusCode').should('eq', 201);
        cy.contains(/zahtev je uspe.no podnet|u obradi/i).should('be.visible');
    });
});
