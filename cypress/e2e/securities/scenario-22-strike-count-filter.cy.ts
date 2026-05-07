import { buildStocks, loginAs, agentUser } from './helpers';

// currentPrice = 415.20 (MSFT)
// 6 strikova: 390, 400, 410 (ispod cene), 420, 430, 440 (iznad cene)
// sharedIdx = indeks prvog strike-a >= 415.20 = 3 (strike 420)
// above = [390, 400, 410], below = [420, 430, 440]
// strikeCount=3 → visAbove=[390,400,410], visBelow=[420,430,440] → 6 redova
// strikeCount=2 → visAbove=[400,410],     visBelow=[420,430]     → 4 redova
// strikeCount=1 → visAbove=[410],         visBelow=[420]         → 2 redova

const EXP = '2026-06-20';

// Backend flat format
const backendStock = {
  ...buildStocks()[0],
  history: [],
  options: [390, 400, 410, 420, 430, 440].flatMap(strike => [
    { listing_id: strike * 10,     option_type: 'CALL', settlement_date: EXP, strike, price: 5.0, bid: 4.9, ask: 5.1, volume: 500, open_interest: 2000, implied_volatility: 0.25 },
    { listing_id: strike * 10 + 1, option_type: 'PUT',  settlement_date: EXP, strike, price: 3.0, bid: 2.9, ask: 3.1, volume: 400, open_interest: 1500, implied_volatility: 0.20 },
  ]),
};

describe('Scenario 22: Filtriranje broja prikazanih strike vrednosti opcija', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: [buildStocks()[0]],
    }).as('getStocks');

    cy.intercept({ method: 'GET', pathname: `/api/listings/stocks/${buildStocks()[0].listing_id}` }, {
      statusCode: 200,
      body: backendStock,
    }).as('getStockDetail');

    loginAs(agentUser, '/securities');
    cy.wait('@getStocks');

    cy.contains('tbody tr', 'MSFT').click();
    cy.wait('@getStockDetail');
  });

  it('defaultno prikazuje do 4 strike-a iznad i ispod (strikeCount=4)', () => {
    // Imamo samo 3 iznad i 3 ispod, pa defaultni strikeCount=4 pokazuje svih 6
    cy.get('tr[class*="optionRow"]').should('have.length', 6);
  });

  it('postavljanje Strikes ± na 2 prikazuje 2 reda iznad i 2 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('2');

    cy.get('tr[class*="optionRow"]').should('have.length', 4);
  });

  it('postavljanje Strikes ± na 3 prikazuje 3 reda iznad i 3 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('3');

    cy.get('tr[class*="optionRow"]').should('have.length', 6);
  });

  it('postavljanje Strikes ± na 1 prikazuje 1 red iznad i 1 ispod', () => {
    cy.contains('label', 'Strikes ±').parent().find('select').select('1');

    cy.get('tr[class*="optionRow"]').should('have.length', 2);
  });
});
