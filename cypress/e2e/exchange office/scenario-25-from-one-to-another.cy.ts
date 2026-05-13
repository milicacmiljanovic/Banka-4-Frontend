/// <reference types="cypress" />

describe('Scenario 25: Provera ekvivalentnosti valute (Kalkulator)', () => {
    it('izračunava iznos konverzije bez izvršavanja transakcije', () => {
        cy.loginAsClient();

        cy.server();
        cy.route('GET', '**/exchange/rates*', {
            statusCode: 200,
            body: {
                rates: [
                    { currency: 'EUR', buy_rate: 79, sell_rate: 80 },
                    { currency: 'USD', buy_rate: 120, sell_rate: 121 },
                    { currency: 'CHF', buy_rate: 121, sell_rate: 122 },
                    { currency: 'GBP', buy_rate: 136, sell_rate: 137 },
                    { currency: 'JPY', buy_rate: 0.71, sell_rate: 0.73 },
                    { currency: 'CAD', buy_rate: 79.2, sell_rate: 80.2 },
                    { currency: 'AUD', buy_rate: 72.8, sell_rate: 73.8 },
                ],
            },
        }).as('getRates');

        cy.visit('/client/exchange');
        cy.wait('@getRates').its('response.statusCode').should('eq', 200);

        cy.location('pathname').should('eq', '/client/exchange');
        cy.contains('h2', /kalkulator valuta/i).should('be.visible').parent().as('calculatorCard');

        const testAmount = '100';
        cy.get('@calculatorCard').within(() => {
            cy.contains('label', /iznos/i)
                .parent()
                .find('input[type="number"]')
                .focus()
                .type('{selectall}100');

            cy.contains('label', /iz valute/i)
                .parent()
                .find('select')
                .select('USD');

            cy.contains('label', /u valutu/i)
                .parent()
                .find('select')
                .select('EUR');

            // Formula UI-a: amount * buy(from) / sell(to) => 100 * 120 / 80 = 150
            cy.contains(/150[,.]00\s*EUR/i).should('be.visible');
        });

        // Kalkulator samo prikazuje rezultat, bez izvršavanja transakcije.
        cy.location('pathname').should('eq', '/client/exchange');
        cy.contains(/transfer uspešno|uspešno izvršen|nalog je uspešno poslat/i).should('not.exist');
    });
});