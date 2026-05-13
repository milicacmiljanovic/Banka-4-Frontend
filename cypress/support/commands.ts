/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            loginAsClient(): Chainable<void>;
            loginAsAdmin(): Chainable<void>;
            loginAsClientAna(): Chainable<void>;
            loginAsNikola(): Chainable<void>;
            loginAsJelena() : Chainable<void>;
            loginAsMirko(): Chainable<void>;
        }
    }
}
export {};

type LoginPayload = {
    user: Record<string, unknown>;
    token: string;
    refresh_token?: string;
};

function visitWithAuth(user: Record<string, unknown>, token: string, refreshToken?: string) {
    cy.visit('/', {
        onBeforeLoad(win) {
            win.localStorage.setItem('token', token);
            if (refreshToken) {
                win.localStorage.setItem('refreshToken', refreshToken);
            } else {
                win.localStorage.removeItem('refreshToken');
            }
            win.localStorage.setItem('user', JSON.stringify(user));
        },
    });
}

function requireApiUrl() {
    const apiUrl = Cypress.env('API_URL') as string | undefined;
    const fallbackApiUrl = 'http://rafsi.davidovic.io:8080/api';
    const resolvedApiUrl = apiUrl && !apiUrl.includes('localhost') ? apiUrl : fallbackApiUrl;

    if (!resolvedApiUrl) throw new Error('Missing Cypress env API_URL');
    return resolvedApiUrl;
}

function loginUser(email: string, password: string) {
    const apiUrl = requireApiUrl();

    cy.request('POST', `${apiUrl}/auth/login`, {
        email,
        password,
    }).then((res) => {
        expect(res.status).to.eq(200);
        const { user, token, refresh_token } = res.body as LoginPayload;
        visitWithAuth(user, token, refresh_token);
    });
}

Cypress.Commands.add('loginAsAdmin', () => {
    loginUser('admin@raf.rs', 'admin123');
});

Cypress.Commands.add('loginAsClient', () => {
    loginUser('marko.markovic@example.com', 'password123');
});

Cypress.Commands.add('loginAsClientAna', () => {
    loginUser('ana.anic@example.com', 'password123');
});

Cypress.Commands.add('loginAsNikola', () => {
    loginUser('nikola@raf.rs', 'pass123');
});

Cypress.Commands.add('loginAsJelena', () => {
    loginUser('jelena@raf.rs', 'pass123');
});

Cypress.Commands.add('loginAsMirko', () => {
    loginUser('mirko.mirkovic@example.com', 'password123');
});