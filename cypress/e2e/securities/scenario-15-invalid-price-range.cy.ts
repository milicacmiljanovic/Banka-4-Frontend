import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 15: Filtriranje sa nevalidnim opsegom cene', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');
  });

  it('prikazuje grešku kad je minimalna cena veća od maksimalne', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="number"][placeholder="Min"]').first().clear().type('500');
    cy.get('input[type="number"][placeholder="Max"]').first().clear().type('100');

    cy.contains('button', 'Primeni filtere').click();

    cy.contains('minimalna vrednost ne može biti veća od maksimalne').should('be.visible');
  });

  it('filtriranje se ne primenjuje — sve hartije ostaju vidljive', () => {
    cy.contains('button', 'Filteri').click();

    cy.get('input[type="number"][placeholder="Min"]').first().clear().type('500');
    cy.get('input[type="number"][placeholder="Max"]').first().clear().type('100');

    cy.contains('button', 'Primeni filtere').click();

    // panel ostaje otvoren, podaci nisu filtrirani
    cy.contains('MSFT').should('be.visible');
    cy.contains('AAPL').should('be.visible');
    cy.contains('JPM').should('be.visible');
  });
});