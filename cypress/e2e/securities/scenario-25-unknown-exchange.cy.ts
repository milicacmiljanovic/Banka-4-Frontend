describe('Scenario 25: Prikaz hartija sa nepoznatog exchange-a', () => {
// Real backend trenutno već filtrira invalid exchange vrednosti,
// pa test validira da frontend prikazuje isti broj hartija kao broj
// backend zapisa sa validnim exchange vrednostima.
  it('tabela prikazuje samo hartije sa validnim exchange-om u odnosu na backend', () => {
    cy.intercept({ method: 'GET', url: '**/listings/stocks**' }).as('getStocks');
    cy.loginAsClient();
    cy.visit('/client/securities');
    cy.contains('h1', /Hartije od vrednosti/i).should('be.visible');

    cy.wait('@getStocks').then(({ response }) => {
      const body = response?.body ?? [];
      const data: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      const validCount = data.filter(s => s.exchange?.trim()).length;

      if (validCount === 0) {
        cy.contains('Nema hartija za prikaz.').should('be.visible');
      } else {
        cy.contains(`${validCount} ukupno`).should('be.visible');
      }
    });
  });
});
