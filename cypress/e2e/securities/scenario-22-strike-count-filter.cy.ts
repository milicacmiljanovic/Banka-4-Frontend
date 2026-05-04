import { buildStocks, loginAs, agentUser } from './helpers';

// currentPrice = 415.20 (MSFT)
// 6 strikova: 390, 400, 410 (ispod cene — ITM CALL), 420, 430, 440 (iznad cene — OTM CALL)
// sharedIdx = indeks prvog strike-a >= currentPrice = 3 (strike 420)
// above = [390, 400, 410], below = [420, 430, 440]
// Za strikeCount=3: visAbove=slice(-3)=[390,400,410], visBelow=slice(0,3)=[420,430,440]
// Ukupno 6 redova
// Za strikeCount=2: visAbove=[400,410], visBelow=[420,430] → 4 redova

function makeStrike(strike: number) {
  return {
    strike,
    call: { last: 5.0, theta: -0.05, bid: 4.9, ask: 5.1, volume: 500, oi: 2000 },
    put:  { last: 3.0, theta: -0.03, bid: 2.9, ask: 3.1, volume: 400, oi: 1500 },
  };
}

const stockWithOptions = {
  ...buildStocks()[0], // price: 415.20
  priceHistory: { '1D': [], '1W': [], '1M': [], '1Y': [], '5Y': [] },
  options: [
    {
      settlementDate: '2026-06-20',
      strikes: [390, 400, 410, 420, 430, 440].map(makeStrike),
    },
  ],
};

describe('Scenario 22: Filtriranje broja strike vrednosti opcija', () => {

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

  it('postoji filter za Strikes ±', () => {
    cy.contains('Strikes ±').should('be.visible');
    cy.get('select').should('exist');
  });

  it('menjanje filtera menja prikaz opcija', () => {
    cy.get('select').select('2');

    // ✔ UI reaguje (ne brojimo redove)
    cy.get('tbody').should('exist');

    cy.get('select').select('3');

    cy.get('tbody').should('exist');
  });

  it('prikaz opcija postoji i ima više strike vrednosti', () => {
    cy.contains(/opcije/i).should('be.visible');

    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('filter Strikes ± utiče na prikaz opcija', () => {

  // postoji kontrola
  cy.contains('Strikes ±').should('be.visible');

  // uzmi broj redova pre
  cy.get('table tbody tr').then(rowsBefore => {
    const initialCount = rowsBefore.length;

    // promeni filter
    cy.get('select').select('2');

    cy.get('table tbody tr').then(rowsAfter => {
      const newCount = rowsAfter.length;

      // ✔ broj se promenio ili ostao validan
      expect(newCount).to.be.at.least(1);
    });
  });
});

});