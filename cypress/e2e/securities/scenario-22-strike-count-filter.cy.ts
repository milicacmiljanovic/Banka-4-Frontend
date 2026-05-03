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

describe('Scenario 22: Filtriranje broja prikazanih strike vrednosti opcija', () => {
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

  it('defaultno prikazuje 4 strike-a iznad i ispod (strikeCount=4)', () => {
    // Defaultni strikeCount je 4, ali imamo samo 3 iznad i 3 ispod
    // Dakle prikazuje sve 6 redova
    cy.get('table tbody tr.optionRow, table tbody tr[class*="optionRow"]')
      .should('have.length', 6);
  });

  it('postavljanje Strikes ± na 2 prikazuje 2 reda iznad i 2 ispod', () => {
    cy.contains('label', 'Strikes ±')
      .parent()
      .find('select')
      .select('2');

    // 2 iznad + 2 ispod Shared Price = 4 redova
    cy.get('table tbody tr.optionRow, table tbody tr[class*="optionRow"]')
      .should('have.length', 4);
  });

  it('postavljanje Strikes ± na 3 prikazuje 3 reda iznad i 3 ispod', () => {
    cy.contains('label', 'Strikes ±')
      .parent()
      .find('select')
      .select('3');

    cy.get('table tbody tr.optionRow, table tbody tr[class*="optionRow"]')
      .should('have.length', 6);
  });

  it('postavljanje Strikes ± na 1 prikazuje 1 red iznad i 1 ispod', () => {
    cy.contains('label', 'Strikes ±')
      .parent()
      .find('select')
      .select('1');

    cy.get('table tbody tr.optionRow, table tbody tr[class*="optionRow"]')
      .should('have.length', 2);
  });
});