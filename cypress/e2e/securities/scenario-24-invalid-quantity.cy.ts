import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 24: Kreiranje ordera sa nevalidnom količinom', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    // Mora biti pre klika — modal odmah fetcha accounts, 401 bi triggerovao logout
    cy.intercept('GET', '**/accounts*', { statusCode: 200, body: { data: [] } });

    cy.contains('tbody tr', 'MSFT').within(() => {
      cy.contains('button', 'Kreiraj nalog').click();
    });
  });

  it('prikazuje grešku za količinu 0', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('0');

    cy.contains('Količina mora biti pozitivan').should('be.visible');
  });

  it('prikazuje grešku za negativnu količinu', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('-5');

    cy.contains('Količina mora biti pozitivan').should('be.visible');
  });

  it('dugme Nastavi je disabled dok je količina nevalidna', () => {
    cy.get('input[placeholder="Unesite količinu..."]').type('0');

    cy.contains('button', 'Nastavi').should('be.disabled');
  });
});
