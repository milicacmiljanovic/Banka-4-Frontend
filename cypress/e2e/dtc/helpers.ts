/// <reference types="cypress" />

export const USER_SERVICE_URL = 'http://rafsi.davidovic.io:8080/api';
export const BANKING_SERVICE_URL = 'http://rafsi.davidovic.io:8081/api';
export const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

export const ANA_EMAIL = Cypress.env('ANA_EMAIL') as string;
export const ANA_PASSWORD = Cypress.env('ANA_PASSWORD') as string;
export const ANA_ACCOUNT = Cypress.env('ANA_ACCOUNT') as string;

export function extractArray(body: any): any[] {
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.content)) return body.content;
    if (Array.isArray(body?.items)) return body.items;
    if (Array.isArray(body?.assets)) return body.assets;
    if (Array.isArray(body?.accounts)) return body.accounts;
    return [];
}

export function getFieldSelect(labelText: string) {
    return cy.contains('span', new RegExp(`^${labelText}$`, 'i'))
        .closest('label')
        .find('select');
}

export function daysBetweenNow(dateValue: string) {
    const nextRun = new Date(dateValue).getTime();
    const now = Date.now();
    return (nextRun - now) / (1000 * 60 * 60 * 24);
}
