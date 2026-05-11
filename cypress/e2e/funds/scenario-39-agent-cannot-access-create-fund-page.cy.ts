describe('Scenario 39: Agent nema pristup stranici za kreiranje fonda', () => {
  beforeEach(() => {
    const apiUrl = Cypress.env('API_URL');
    if (!apiUrl) throw new Error('Missing Cypress env API_URL');

    cy.request('POST', `${apiUrl}/auth/login`, {
      email: 'marko@raf.rs',
      password: 'pass123',
    }).then((res) => {
      expect(res.status).to.eq(200);

      const { user, token, refresh_token } = res.body;

      cy.visit('/investment-funds/new', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          if (refresh_token) win.localStorage.setItem('refreshToken', refresh_token);
          else win.localStorage.removeItem('refreshToken');
          win.localStorage.setItem('user', JSON.stringify(user));
        },
      });
    });
  });

  it('odbija pristup stranici za kreiranje fonda', () => {
    cy.url().should('not.include', '/investment-funds/new');

    cy.contains('Kreiranje investicionog fonda').should('not.exist');
    cy.get('input[placeholder="npr. Globalni rast"]').should('not.exist');
    cy.get('textarea[placeholder*="Kratki opis"]').should('not.exist');
    cy.get('input[placeholder="npr. 10000"]').should('not.exist');
    cy.contains('button', 'Kreiraj fond').should('not.exist');
  });
});