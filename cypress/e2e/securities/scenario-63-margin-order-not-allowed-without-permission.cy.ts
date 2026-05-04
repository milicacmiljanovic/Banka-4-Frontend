import {
  buildClientAccounts,
  buildLoans,
  buildStocks,
  clientUser,
  loginAs,
  openBuyModal,
} from '../../support/helpers';

describe('Scenario 63: Margin order nije dozvoljen bez permisije', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/listings/stocks*', {
      statusCode: 200,
      body: buildStocks(),
    }).as('getStocks');

    cy.intercept('GET', '**/api/listings/stocks/1*', {
      statusCode: 200,
      body: buildStocks()[0],
    }).as('getStockDetails');

    cy.intercept('GET', '**/api/clients/*/accounts*', {
      statusCode: 200,
      body: buildClientAccounts(0),
    }).as('getAccounts');

    cy.intercept('GET', '**/api/clients/*/loans*', {
      statusCode: 200,
      body: buildLoans([]),
    }).as('getLoans');

    cy.intercept('POST', '**/api/orders', {
      statusCode: 403,
      body: {
        message: 'Margin order nije dozvoljen bez permisije.',
      },
    }).as('createOrder');

    loginAs(clientUser, '/client/securities');
  });

  it('ne dozvoljava nastavak i prikazuje odgovarajuću poruku', () => {
    cy.wait('@getStocks');

    openBuyModal();
    cy.wait('@getAccounts');
    cy.wait('@getLoans');

    cy.get('select').eq(1).select('340-111-222');
    cy.get('input[placeholder="Unesite količinu..."]').clear().type('10');
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });

    cy.contains('button', 'Nastavi').click();

    cy.get('@createOrder.all').should('have.length', 0);
    cy.contains(/odobren zajam|stanje računa|najmanje 500/i).should('be.visible');
  });
});