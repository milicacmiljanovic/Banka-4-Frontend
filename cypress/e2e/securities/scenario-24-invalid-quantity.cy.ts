import { buildStocks, loginAs, agentUser, primaryAccount } from './helpers';

describe('Scenario 24: Kreiranje ordera sa nevalidnom količinom', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/accounts**', {
      statusCode: 200,
      body: { data: [primaryAccount] },
    }).as('getAccounts');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    // Otvori order modal klikom na Kreiraj nalog
    cy.contains('tbody tr', 'MSFT').within(() => {
      cy.contains('button', /Kreiraj nalog|Kupi/).click();
    });
  });

  it('odbija order kada je količina 0', () => {
    cy.contains('label', 'Količina')
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('0');

    cy.contains('Količina mora biti pozitivan').should('be.visible');

    // Nastavi dugme treba da je disabled ili da prikaže grešku
    cy.contains('button', 'Nastavi').click({ force: true });
    cy.contains('h4', 'Potvrda ordera').should('not.exist');
  });

  it('odbija order kada je količina negativna', () => {
    cy.contains('label', 'Količina')
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('-5');

    cy.contains('Količina mora biti pozitivan').should('be.visible');

    cy.contains('button', 'Nastavi').click({ force: true });
    cy.contains('h4', 'Potvrda ordera').should('not.exist');
  });

  it('Nastavi dugme je onemogućeno dok postoji greška u količini', () => {
    cy.contains('label', 'Količina')
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('0');

    cy.contains('button', 'Nastavi').should('be.disabled');
  });
});