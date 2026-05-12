// cypress/support/index.d.ts
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

function requireApiUrl() {
    const apiUrl = Cypress.env('API_URL');
    if (!apiUrl) throw new Error('Missing Cypress env API_URL');
    return apiUrl as string;
}

function setupSession(sessionKey: string, email: string, password: string) {
    const apiUrl = requireApiUrl();

    cy.session(
        sessionKey,
        () => {
            cy.request<LoginPayload>('POST', `${apiUrl}/auth/login`, {
                email,
                password,
            }).then((res) => {
                expect(res.status).to.eq(200);
                const { user, token, refresh_token } = res.body;

                cy.visit('/login', {
                    onBeforeLoad(win) {
                        win.localStorage.setItem('token', token);
                        if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
                        else win.localStorage.removeItem('refreshToken');
                        win.localStorage.setItem('user', JSON.stringify(user));
                    },
                });
            });
        },
        {
            cacheAcrossSpecs: true,
            validate() {
                cy.window().then((win) => {
                    const token = win.localStorage.getItem('token');
                    const user = win.localStorage.getItem('user');
                    expect(token, 'session token').to.be.a('string').and.not.be.empty;
                    expect(user, 'session user').to.be.a('string').and.not.be.empty;
                });
            },
        }
    );
}

Cypress.Commands.add('loginAsAdmin', () => {
    setupSession('admin', 'admin@raf.rs', 'admin123');
});

Cypress.Commands.add('loginAsClient', () => {
    setupSession('client-marko', 'marko.markovic@example.com', 'password123');
});

Cypress.Commands.add('loginAsClientAna', () => {
    setupSession('client-ana', 'ana.anic@example.com', 'password123');
});

Cypress.Commands.add('loginAsNikola', () => {
    setupSession('client-nikola', 'nikola@raf.rs', 'pass123');
});

Cypress.Commands.add('loginAsJelena', () => {
    setupSession('client-jelena', 'jelena@raf.rs', 'pass123');
});

Cypress.Commands.add('loginAsMirko', () => {
    setupSession('client-mirko', 'mirko.mirkovic@example.com', 'password123');
});