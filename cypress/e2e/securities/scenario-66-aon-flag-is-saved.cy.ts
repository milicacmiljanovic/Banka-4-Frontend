import {
  buildClientAccounts,
  buildLoans,
  buildStocks,
  clientUser,
  loginAs,
  openBuyModal,
} from '../../support/helpers';

describe('Scenario 66: AON oznaka se čuva uz order', () => {
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
      body: buildClientAccounts(10000),
    }).as('getAccounts');

    cy.intercept('GET', '**/api/clients/*/loans*', {
      statusCode: 200,
      body: buildLoans([]),
    }).as('getLoans');

    cy.intercept('POST', '**/api/orders', (req) => {
      expect(req.body.all_or_none).to.eq(true);

      req.reply({
        statusCode: 201,
        body: {
          id: 501,
          status: 'PENDING',
          all_or_none: true,
        },
      });
    }).as('createOrder');

    loginAs(clientUser, '/client/securities');
  });

  it('order se čuva sa AON oznakom', () => {
    cy.wait('@getStocks');

    openBuyModal();
    cy.wait('@getAccounts');
    cy.wait('@getLoans');

    cy.get('select').eq(1).select('340-111-222');
    cy.get('input[placeholder="Unesite količinu..."]').clear().type('10');
    cy.get('input[type="checkbox"]').eq(0).check({ force: true });

    cy.contains('button', 'Nastavi').click();
    cy.contains('Potvrda ordera').should('be.visible');
    cy.contains('button', 'Potvrdi').click();

    cy.wait('@createOrder');
  });
});