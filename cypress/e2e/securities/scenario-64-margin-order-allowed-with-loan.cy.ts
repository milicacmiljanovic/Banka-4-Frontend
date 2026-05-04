import {
  buildClientAccounts,
  buildLoans,
  buildStocks,
  marginClientUser,
  loginAs,
  openBuyModal,
} from '../../support/helpers';

describe('Scenario 64: Margin order dozvoljen - klijent sa kreditom > Initial Margin Cost', () => {
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
      body: buildLoans([
        { id: 1, amount: 5000, status: 'APPROVED' },
      ]),
    }).as('getLoans');

    cy.intercept('POST', '**/api/orders', (req) => {
      expect(req.body.margin).to.eq(true);

      req.reply({
        statusCode: 201,
        body: {
          id: 401,
          status: 'PENDING',
        },
      });
    }).as('createOrder');

    loginAs(marginClientUser, '/client/securities');
  });

  it('order je prihvaćen kada odobren kredit pokriva initial margin cost', () => {
    cy.wait('@getStocks');

    openBuyModal();
    cy.wait('@getAccounts');
    cy.wait('@getLoans');

    cy.get('select').eq(1).select('340-111-222');
    cy.get('input[placeholder="Unesite količinu..."]').clear().type('10');
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });

    cy.contains('button', 'Nastavi').click();
    cy.contains('Potvrda ordera').should('be.visible');
    cy.contains('button', 'Potvrdi').click();

    cy.wait('@createOrder');
  });
});