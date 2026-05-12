describe('Scenario 43: Klijent pregleda svoje fondove u portfoliju', () => {
  beforeEach(() => {
    cy.loginAsClient();
  });

  it('prikazuje fondove sa udelom i profitom u tabu Moji fondovi', () => {
    // Accept either /api/client/... or /client/... depending on API base URL
    cy.route('GET', '**/client/*/funds').as('getClientFunds');
    const formatMoney = (value: number) => Number(value ?? 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Navigate to portfolio - this triggers the funds API call
    cy.visit('http://localhost:5173/client/portfolio');

    // Click on Moji fondovi tab (use data-testid to avoid clicking header button)
    cy.get('[data-testid="tab-funds"]').click();

    // Wait for funds to be fetched and verify they exist
    cy.wait('@getClientFunds', { timeout: 10000 }).then((xhr) => {
      expect(xhr.status).to.eq(200);
      const funds = Array.isArray(xhr.responseBody) ? xhr.responseBody : (Array.isArray(xhr.responseBody?.data) ? xhr.responseBody.data : []);
      expect(funds.length, 'mora postojati bar jedan fond u portfoliju').to.be.greaterThan(0);

      const firstFund = funds[0];
      const fundName = String(firstFund.fund_name ?? firstFund.name ?? '');
      const fundDescription = String(firstFund.fund_description ?? firstFund.description ?? '');
      const shareValue = formatMoney(firstFund.clients_share_value_rsd ?? firstFund.client_share_value ?? 0);
      const sharePercent = Number(firstFund.clients_share_percent ?? firstFund.client_share_percentage ?? 0).toFixed(2);
      const profit = formatMoney(firstFund.total_profit ?? firstFund.profit ?? 0);

      cy.contains('h4', fundName).should('be.visible');
      if (fundDescription) {
        cy.contains(fundDescription).should('be.visible');
      }
      cy.contains('Vaš udeo:').should('be.visible');
      cy.contains(shareValue).should('be.visible');
      cy.contains('Procenat:').should('be.visible');
      cy.contains(`${sharePercent}%`).should('be.visible');
      cy.contains('Profit:').should('be.visible');
      cy.contains(profit).should('be.visible');
    });
  });
});
