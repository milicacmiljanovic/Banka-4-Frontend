import { buildStocks, loginAs, agentUser } from './helpers';

describe('Scenario 16: Ručno osvežavanje podataka o hartiji', () => {
  it('osvežava cenu, volumen i promenu i prikazuje novo vreme poslednjeg osvežavanja', () => {
    const stock = buildStocks()[0]; // MSFT, price 415.20

    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [stock],
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${stock.listing_id}` }, {
      statusCode: 200,
      body: { ...stock, price: 420.00, change: 8.30, change_percent: 2.01, volume: 23000000 },
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    // Selektuj hartiju
    cy.contains('tbody tr', stock.ticker).click();
    cy.wait('@getStockDetail');

    // Postavi novi odgovor za osvežavanje
    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${stock.listing_id}` }, {
      statusCode: 200,
      body: { ...stock, price: 430.50, change: 18.80, change_percent: 4.56, volume: 25000000 },
    }).as('getStockRefresh');

    cy.contains('button', 'Osveži').click();
    cy.wait('@getStockRefresh');

    // Nova cena je prikazana
    cy.contains('430,50').should('be.visible'); // cena

    // change (zavisi kako ga prikazuješ, primer)
    cy.contains('4,56').should('exist');
    
    // volume (format može varirati)
    cy.contains('25.000.000').should('exist'); // ili preciznije ako znaš format
    
    // vreme osvežavanja (bitno)
    cy.get('[data-testid="last-updated"]').should('exist');
    cy.get('[data-testid="last-updated"]').invoke('text').then(first => {
    cy.contains('button', 'Osveži').click();
    cy.wait('@getStockRefresh');
  
    cy.get('[data-testid="last-updated"]').invoke('text').should(second => {
      expect(second).not.to.eq(first);
    });
  });
  });
});