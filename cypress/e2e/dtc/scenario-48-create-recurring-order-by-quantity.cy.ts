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

const TARGET_TICKER = 'SLDP';


let authToken: string;
let anaClientId: number | string;
let targetListingId: number | null = null;
let createdRecurringOrderId: number | null = null;



describe('Scenario 48: Kreiranje trajnog naloga BYQUANTITY', () => {
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

    it('kreira RecurringOrder sa active=true za nedeljni BY_QUANTITY nalog', () => {
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
        cy.contains('button', /po količini/i).click();
        getFieldSelect('Učestalost').select('WEEKLY');

        cy.get('input[placeholder="Unesite količinu"]')
            .should('be.visible')
            .clear()
            .type('5');

        getFieldSelect('Račun').select(ANA_ACCOUNT);

        cy.contains('button', /^Kreiraj nalog$/i).click();

        cy.wait('@createRecurringOrder').then(({ request, response }) => {
            expect(response?.statusCode).to.eq(201);

            expect(request.body).to.deep.include({
                account_number: ANA_ACCOUNT,
                cadence: 'WEEKLY',
                direction: 'BUY',
                listing_id: targetListingId,
                mode: 'BY_QUANTITY',
                value: 5,
            });

            const body = response?.body ?? {};
            createdRecurringOrderId = body.recurring_order_id;

            expect(createdRecurringOrderId, 'recurring_order_id mora postojati').to.exist;
            expect(body.active).to.eq(true);
            expect(body.mode).to.eq('BY_QUANTITY');
            expect(body.direction).to.eq('BUY');
            expect(body.cadence).to.eq('WEEKLY');
            expect(Number(body.value)).to.eq(5);
            expect(body.account_number).to.eq(ANA_ACCOUNT);
            expect(Number(body.listing_id), 'response listing_id mora odgovarati izabranoj hartiji').to.eq(targetListingId);
            expect(body.next_run, 'next_run mora postojati').to.be.a('string').and.not.empty;

            const diffDays = daysBetweenNow(body.next_run);
            expect(diffDays, 'next_run za WEEKLY treba da bude približno za sledeću nedelju')
                .to.be.greaterThan(5)
                .and.to.be.lessThan(9);
        });

        cy.contains('td', 'WEEKLY').should('be.visible');
        cy.contains('td', ANA_ACCOUNT).should('be.visible');
        cy.contains('td', /5 kom/i).should('be.visible');
        cy.contains('span', /^Da$/i).should('be.visible');
        cy.contains('td', 'WEEKLY').should('be.visible');
        cy.contains('td', /5 kom/i).should('be.visible');
        cy.contains('span', /^Da$/i).should('be.visible');
    });
});

export {};
