import { buildStocks, loginAs, agentUser } from './helpers';

// currentPrice = 415.20 (MSFT iz buildStocks)
// ITM CALL: strike < currentPrice  → strike 400, 410
// ITM PUT:  strike > currentPrice  → strike 420, 430
// OTM CALL: strike > currentPrice  → strike 420, 430
// OTM PUT:  strike < currentPrice  → strike 400, 410
const stockWithOptions = {
  ...buildStocks()[0], // price: 415.20
  priceHistory: { '1D': [], '1W': [], '1M': [], '1Y': [], '5Y': [] },
  options: [
    {
      settlementDate: '2026-06-20',
      strikes: [
        {
          strike: 400,
          call: { last: 15.2, theta: -0.05, bid: 15.0, ask: 15.4, volume: 1200, oi: 8000 },
          put:  { last: 0.8,  theta: -0.01, bid: 0.75, ask: 0.85, volume: 300,  oi: 1500 },
        },
        {
          strike: 410,
          call: { last: 10.5, theta: -0.06, bid: 10.3, ask: 10.7, volume: 950, oi: 6000 },
          put:  { last: 2.1,  theta: -0.02, bid: 2.0,  ask: 2.2,  volume: 500, oi: 3000 },
        },
        {
          strike: 420,
          call: { last: 4.0,  theta: -0.08, bid: 3.8,  ask: 4.2,  volume: 600, oi: 3000 },
          put:  { last: 7.8,  theta: -0.04, bid: 7.6,  ask: 8.0,  volume: 900, oi: 5000 },
        },
        {
          strike: 430,
          call: { last: 1.5,  theta: -0.09, bid: 1.4,  ask: 1.6,  volume: 200, oi: 1000 },
          put:  { last: 14.0, theta: -0.05, bid: 13.8, ask: 14.2, volume: 1100, oi: 7000 },
        },
      ],
    },
  ],
};

describe('Scenario 21: Tabela opcija prikazuje ITM i OTM polja bojom', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [buildStocks()[0]],
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${buildStocks()[0].listing_id}` }, {
      statusCode: 200,
      body: stockWithOptions,
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');
  });

  it('Shared Price je jasno prikazan', () => {
    cy.contains('Tržišna cena akcije (Shared Price)').should('be.visible');
    cy.contains('415').should('be.visible');
  });

  it('ćelije ITM CALL opcija (strike < cena) imaju itm klasu', () => {
    // Strike 400 je ITM za CALL jer 400 < 415.20
    cy.contains('td', '$400')
      .closest('tr')
      .find('td')
      .first()
      .should('have.class', /itm/);
  });

  it('ćelije OTM CALL opcija (strike > cena) imaju otm klasu', () => {
    // Strike 430 je OTM za CALL jer 430 > 415.20
    cy.contains('td', '$430')
      .closest('tr')
      .find('td')
      .first()
      .should('have.class', /otm/);
  });

  it('ćelije ITM PUT opcija (strike > cena) imaju itm klasu', () => {
    // Strike 430 je ITM za PUT jer 430 > 415.20
    cy.contains('td', '$430')
      .closest('tr')
      .find('td')
      .eq(7) // 7. td je prva PUT kolona (Last)
      .should('have.class', /itm/);
  });

  it('legenda prikazuje ITM i OTM oznake', () => {
    cy.contains('In-The-Money').should('be.visible');
    cy.contains('Out-of-Money').should('be.visible');
  });
});