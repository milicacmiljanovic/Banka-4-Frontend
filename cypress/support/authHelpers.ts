export function visitEmployeeLogin() {
    cy.visit('/login');
    cy.contains('button', 'Zaposleni').click();
}

export function fillLoginForm(email: string, password: string) {
    cy.get('#email').clear({ force: true }).type(email, { force: true });
    cy.get('#password').clear({ force: true }).type(password, { force: true, log: false });
}

export function submitLogin() {
    cy.contains('button', 'Prijavi se').click();
}

export function assertTokenStored() {
    cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        expect(token, 'localStorage.token').to.be.a('string').and.not.be.empty;
    });
}