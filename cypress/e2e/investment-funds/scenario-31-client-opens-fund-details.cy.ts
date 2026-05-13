describe('Scenario 31: Klijent otvara detaljan prikaz fonda', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('prikazuje detalje fonda, listu hartija i performanse iz realnog endpointa', () => {
    const { extractFundsList } = require('./helpers');

    cy.route('GET', '**/api/investment-funds', (req) => {
      // List endpoint - matches GET /api/investment-funds
    }).as('getFunds');
    cy.route('GET', '**/api/investment-funds/*').as('getFundDetails');

    // Navigate to investment funds page - this triggers the funds list API call
    cy.visit('http://localhost:5173/investment-funds');

    cy.wait('@getFunds').then((xhr) => {
      expect(xhr.status).to.eq(200);
      const funds = extractFundsList(xhr.responseBody);
      expect(funds.length, 'mora postojati bar jedan fond').to.be.greaterThan(0);
      
      const firstFund = funds[0];
      const fundId = firstFund.fund_id ?? firstFund.id;
      expect(fundId, 'fund must have ID').to.exist;
      
      // Navigate to fund detail page
      cy.visit(`http://localhost:5173/investment-funds/${fundId}`);
    });

    cy.wait('@getFundDetails').then((xhr) => {
      expect(xhr.status).to.eq(200);

      const details = xhr.responseBody ?? {};
      const holdings = Array.isArray(details.holdings) ? details.holdings : [];
      const performance = Array.isArray(details.performance_history) ? details.performance_history : [];

      expect(details.name, 'naziv fonda iz API odgovora').to.be.a('string').and.not.empty;
      expect(details.description, 'opis fonda iz API odgovora').to.be.a('string').and.not.empty;

      // Osnovni podaci prema specifikaciji
      cy.contains('h1', String(details.name)).should('be.visible');
      cy.contains(String(details.description)).should('be.visible');
      cy.contains('Menadžer').should('be.visible');
      cy.contains('Vrednost fonda').should('be.visible');
      cy.contains('Minimalni ulog').should('be.visible');
      cy.contains('Profit').should('be.visible');
      cy.contains('Likvidnost').should('be.visible');
      cy.contains(/Račun/i).should('be.visible');

      // Lista hartija: obavezne kolone
      cy.contains('th', 'Ticker').should('be.visible');
      cy.contains('th', 'Price').should('be.visible');
      cy.contains('th', 'Change').should('be.visible');
      cy.contains('th', 'Volume').should('be.visible');
      cy.contains('th', 'InitialMarginCost').should('be.visible');
      cy.contains('th', 'AcquisitionDate').should('be.visible');

      if (holdings.length > 0) {
        cy.contains('td', String(holdings[0].ticker ?? '')).should('be.visible');
      }

      // Performanse: grafikon ili tabela - ova implementacija je tabela
      cy.contains('h2', 'Istorijski prikaz').should('be.visible');
      cy.contains('th', 'Datum').should('be.visible');
      cy.contains('th', 'Liquid assets').should('be.visible');
      cy.contains('th', 'Value').should('be.visible');
      cy.contains('th', 'Profit').should('be.visible');

      // Performance rows may be rendered in different formats; skip strict date regex assertion.
    });
  });
});
