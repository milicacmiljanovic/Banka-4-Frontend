/// <reference types="cypress" />

import {
    ANA_ACCOUNT,
    ANA_EMAIL,
    ANA_PASSWORD,
    BANKING_SERVICE_URL,
    TRADING_SERVICE_URL,
    USER_SERVICE_URL,
    daysBetweenNow,
    extractArray,
    getFieldSelect,
} from './helpers';

const TARGET_TICKER = 'CERS';

let authToken: string;
let anaClientId: number | string;
let targetListingId: number | null = null;
let createdRecurringOrderId: number | null = null;


describe('Scenario 47: Kreiranje trajnog naloga BYAMOUNT', () => {
    before(() => {
        cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
            email: ANA_EMAIL,
            password: ANA_PASSWORD,
        }).then((res) => {
            expect(res.status).to.eq(200);

            authToken = res.body.token;
            anaClientId = res.body.user?.id;

            expect(authToken, 'auth token mora postojati').to.be.a('string').and.not.empty;
            expect(anaClientId, 'Ana user id mora postojati').to.exist;

            cy.request({
                method: 'GET',
                url: `${BANKING_SERVICE_URL}/clients/${anaClientId}/accounts`,
                headers: { Authorization: `Bearer ${authToken}` },
            }).then((accountsRes) => {
                expect(accountsRes.status).to.eq(200);

                const accounts = extractArray(accountsRes.body);
                const account = accounts.find((a: any) => String(a.account_number) === ANA_ACCOUNT);

                expect(account, `Ana mora imati račun ${ANA_ACCOUNT}`).to.exist;

                const balance = Number(account.balance ?? account.available_balance ?? account.availableBalance ?? 0);
                expect(balance, `Ana mora imati bar 5000 RSD na računu ${ANA_ACCOUNT}`).to.be.greaterThan(5000);
            });

            cy.request({
                method: 'GET',
                url: `${TRADING_SERVICE_URL}/listings/stocks`,
                headers: { Authorization: `Bearer ${authToken}` },
            }).then((stocksRes) => {
                expect(stocksRes.status).to.eq(200);

                const stocks = extractArray(stocksRes.body);
                const stock = stocks.find((s: any) => String(s.ticker).toUpperCase() === TARGET_TICKER);

                expect(stock, `Hartija ${TARGET_TICKER} mora postojati u seed podacima`).to.exist;

                targetListingId = Number(stock.listing_id ?? stock.id);
                expect(targetListingId, `${TARGET_TICKER} mora imati listing_id`).to.be.greaterThan(0);
            });
        });
    });

    beforeEach(() => {
        createdRecurringOrderId = null;

        cy.intercept('GET', '**/api/listings/stocks*').as('getStocks');
        cy.intercept('GET', '**/clients/*/accounts*').as('getAccounts');
        cy.intercept('GET', '**/api/recurring-orders').as('getRecurringOrders');
        cy.intercept('POST', '**/api/recurring-orders').as('createRecurringOrder');

        cy.loginAsClientAna();
        cy.visit('/client/dtc');
    });

    afterEach(() => {
        if (!createdRecurringOrderId) return;

        cy.request({
            method: 'DELETE',
            url: `${TRADING_SERVICE_URL}/recurring-orders/${createdRecurringOrderId}`,
            headers: { Authorization: `Bearer ${authToken}` },
            failOnStatusCode: false,
        });
    });

    it('kreira RecurringOrder sa active=true i next_run za mesečni BY_AMOUNT nalog', () => {
        cy.wait('@getStocks').its('response.statusCode').should('eq', 200);
        cy.wait('@getAccounts').its('response.statusCode').should('eq', 200);
        cy.wait('@getRecurringOrders').its('response.statusCode').should('eq', 200);

        cy.contains('button', /kreiraj trajni nalog/i)
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        cy.contains('h3', /kreiraj trajni nalog/i).should('be.visible');

        getFieldSelect('Smer').select('BUY');
        getFieldSelect('Hartija').select(String(targetListingId));
        cy.contains('button', /po iznosu/i).click();
        getFieldSelect('Učestalost').select('MONTHLY');

        cy.get('input[placeholder="Unesite iznos"]')
            .should('be.visible')
            .clear()
            .type('5000');

        getFieldSelect('Račun').select(ANA_ACCOUNT);

        cy.contains('button', /^Kreiraj nalog$/i).click();

        cy.wait('@createRecurringOrder').then(({ request, response }) => {
            expect(response?.statusCode).to.eq(201);

            expect(request.body).to.deep.include({
                account_number: ANA_ACCOUNT,
                cadence: 'MONTHLY',
                direction: 'BUY',
                listing_id: targetListingId,
                mode: 'BY_AMOUNT',
                value: 5000,
            });

            const body = response?.body ?? {};
            createdRecurringOrderId = body.recurring_order_id;

            expect(createdRecurringOrderId, 'recurring_order_id mora postojati').to.exist;
            expect(body.active).to.eq(true);
            expect(body.mode).to.eq('BY_AMOUNT');
            expect(body.direction).to.eq('BUY');
            expect(body.cadence).to.eq('MONTHLY');
            expect(Number(body.value)).to.eq(5000);
            expect(body.account_number).to.eq(ANA_ACCOUNT);
            expect(Number(body.listing_id), 'response listing_id mora odgovarati izabranoj hartiji').to.eq(targetListingId);
            expect(body.next_run, 'next_run mora postojati').to.be.a('string').and.not.empty;

            const diffDays = daysBetweenNow(body.next_run);
            expect(diffDays, 'next_run za MONTHLY treba da bude približno za sledeći mesec')
                .to.be.greaterThan(25)
                .and.to.be.lessThan(35);
        });

        cy.contains('td', 'MONTHLY').should('be.visible');
        cy.contains('td', ANA_ACCOUNT).should('be.visible');
        cy.contains('span', /^Da$/i).should('be.visible');
        cy.contains('td', 'MONTHLY').should('be.visible');
        cy.contains('td', /5\.000,00 RSD|5000,00 RSD|5,000.00 RSD/i).should('exist');
        cy.contains('span', /^Da$/i).should('be.visible');
    });
});

export {};
