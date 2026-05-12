describe('Scenario 34: Klijent pokušava da uloži manje od minimalnog uloga', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('odbija investiciju i prikazuje poruku o minimalnom iznosu', () => {
    const { normalizeNumber, extractFundsList } = require('./helpers');

    cy.route('GET', '**/api/investment-funds', (req) => {
      // List endpoint - matches GET /api/investment-funds
    }).as('getFunds');
    cy.route('GET', '**/api/investment-funds/*').as('getFundDetails');
    cy.route('POST', '**/investment-funds/*/invest').as('investInFund');

    cy.visit('http://localhost:5173/investment-funds');

    cy.wait('@getFunds').then((xhr) => {
      expect(xhr.status).to.eq(200);
      const funds = extractFundsList(xhr.responseBody);
      expect(funds.length, 'mora postojati bar jedan fond').to.be.greaterThan(0);
      
      const fund = funds[0];
      const fundId = fund.fund_id ?? fund.id;
      expect(fundId, 'fund id must exist').to.exist;
      
      cy.visit(`http://localhost:5173/investment-funds/${fundId}`);
    });

    cy.wait('@getFundDetails').then((xhr) => {
      expect(xhr.status).to.eq(200);
      const details = xhr.responseBody ?? {};
      const min = Math.max(1, normalizeNumber(details.min_investment));
      const tooLow = min > 1 ? min - 1 : 0.5;

      cy.contains('button', 'Investiraj').click();
      cy.get('input[placeholder="Unesite iznos..."]').clear().type(String(tooLow));
      cy.contains('button', 'Potvrdi investiciju').click();

      cy.contains(/Minimalni ulog je/i).should('be.visible');

      cy.get('@investInFund.all').then((calls) => {
        expect(calls.length, 'API poziv ne sme biti poslat za iznos ispod minimuma').to.eq(0);
      });
    });
  });
});
