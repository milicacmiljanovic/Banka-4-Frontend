import { buildStocks, loginAs, agentUser } from './helpers';

// currentPrice = 415.20 (MSFT iz buildStocks)
//
// CALL ITM: strike < currentPrice → strike 400, 410  → zelena rgba(16, 185, 129, ...)
// CALL OTM: strike > currentPrice → strike 420, 430  → crvena rgba(239, 68, 68, ...)
// PUT  ITM: strike > currentPrice → strike 420, 430  → zelena
// PUT  OTM: strike < currentPrice → strike 400, 410  → crvena
//
// Mock mora biti u backend flat formatu (snake_case) —
// getStockById interno poziva mapOptionRaw + groupOptions pre nego što OptionTable dobije podatke.

const GREEN = '16, 185, 129';
const RED   = '239, 68, 68';

function makeOption(option_type: string, strike: number, settlement_date: string) {
  return {
    listing_id:         900 + strike,
    option_type,
    settlement_date,
    strike,
    price:              option_type === 'CALL' ? 15.2 : 0.8,
    bid:                option_type === 'CALL' ? 15.0 : 0.75,
    ask:                option_type === 'CALL' ? 15.4 : 0.85,
    volume:             option_type === 'CALL' ? 1200 : 300,
    open_interest:      option_type === 'CALL' ? 8000 : 1500,
    implied_volatility: 0.25,
  };
}

const EXP = '2026-06-20';
const STRIKES = [400, 410, 420, 430];

// Backend flat format — isti format koji vraća pravi API
const backendStock = {
  ...buildStocks()[0], // listing_id: 1, price: 415.2, snake_case
  history: [],
  options: STRIKES.flatMap(s => [
    makeOption('CALL', s, EXP),
    makeOption('PUT',  s, EXP),
  ]),
};

describe('Scenario 21: Tabela opcija prikazuje ITM i OTM polja bojom', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', pathname: '/api/listings/stocks' }, {
      statusCode: 200,
      body: buildStocks(),
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

  it('Shared Price je jasno prikazan', () => {
    cy.contains('Tržišna cena akcije (Shared Price)').should('be.visible');
    cy.contains('415').should('be.visible');
  });

  it('CALL ITM (strike 400 < cena) — zelena pozadina', () => {
    cy.contains('td', '$400').closest('tr').find('td').first()
      .invoke('css', 'background-color')
      .should('include', GREEN);
  });

  it('CALL OTM (strike 430 > cena) — crvena pozadina', () => {
    cy.contains('td', '$430').closest('tr').find('td').first()
      .invoke('css', 'background-color')
      .should('include', RED);
  });

  it('PUT ITM (strike 430 > cena) — zelena pozadina', () => {
    cy.contains('td', '$430').closest('tr').find('td').eq(7)
      .invoke('css', 'background-color')
      .should('include', GREEN);
  });

  it('PUT OTM (strike 400 < cena) — crvena pozadina', () => {
    cy.contains('td', '$400').closest('tr').find('td').eq(7)
      .invoke('css', 'background-color')
      .should('include', RED);
  });

  it('legenda prikazuje ITM i OTM oznake', () => {
    cy.contains('In-The-Money').should('be.visible');
    cy.contains('Out-of-Money').should('be.visible');
  });
});
