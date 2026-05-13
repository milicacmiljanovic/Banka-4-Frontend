describe('Scenario 32: Supervizor vidi dugme za prodaju pored svake hartije', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('na detaljima fonda prikazuje dugme Prodaj uz svaku hartiju', () => {
    const { extractFundsList } = require('./helpers');

    cy.route('GET', '**/api/investment-funds', (req) => {
      // List endpoint - matches GET /api/investment-funds
    }).as('getFunds');
    cy.route('GET', '**/api/investment-funds/*').as('getFundDetails');

    cy.visit('http://localhost:5173/investment-funds');

    cy.wait('@getFunds').then((xhr) => {
      expect(xhr.status).to.eq(200);
      const funds = extractFundsList(xhr.responseBody);
      expect(funds.length, 'mora postojati bar jedan fond').to.be.greaterThan(0);

      const firstFund = funds[0];
      const fundId = firstFund.fund_id ?? firstFund.id;
      expect(fundId, 'fund id must exist').to.exist;

      cy.visit(`http://localhost:5173/investment-funds/${fundId}`);
    });

    cy.wait('@getFundDetails').then((xhr) => {
      expect(xhr.status).to.eq(200);
      const details = xhr.responseBody ?? {};
      const holdings = Array.isArray(details.holdings) ? details.holdings : [];

      cy.contains('th', 'Ticker').parents('table').first().within(() => {
        if (holdings.length > 0) {
          cy.get('tbody tr').should('have.length', holdings.length);
          cy.contains('button', 'Prodaj').should('be.visible');
          cy.get('tbody tr').each(($row) => {
            cy.wrap($row).contains('button', 'Prodaj').should('exist');
          });
        } else {
          cy.contains('Nema hartija u fondu.').should('be.visible');
        }
      });
    });
  });
});
