import { clientWithTrading, loginAs } from './helpers';

const futureDate = '2099-12-31T00:00:00Z';
const pastDate   = '2020-01-01T00:00:00Z';

const contracts = [
  {
    otc_option_contract_id: 201,
    ticker: 'VALID',
    amount: 25,
    strike_price_rsd: 1500.00,
    premium_rsd: 50.00,
    settlement_date: futureDate,
    seller_id: 9002,
    profit: 125.00,
    status: 'ACTIVE',
  },
  {
    otc_option_contract_id: 202,
    ticker: 'EXPIRED',
    amount: 10,
    strike_price_rsd: 800.00,
    premium_rsd: 20.00,
    settlement_date: pastDate,
    seller_id: 9002,
    profit: -50.00,
    status: 'ACTIVE',
  },
  {
    otc_option_contract_id: 203,
    ticker: 'EXERCISED',
    amount: 15,
    strike_price_rsd: 1200.00,
    premium_rsd: 30.00,
    settlement_date: futureDate,
    seller_id: 9002,
    profit: 200.00,
    status: 'EXERCISED',
  },
];

describe('Scenario 25: Filtriranje sklopljenih ugovora po statusu', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/public*', { statusCode: 200, body: [] }).as('getPublic');

    cy.intercept('GET', '**/otc/contracts*', {
      statusCode: 200,
      body: contracts,
    }).as('getContracts');

    cy.intercept('GET', '**/clients/*/accounts*', {
      statusCode: 200,
      body: { data: [{ accountNumber: '265-1111111111111-11', name: 'Glavni račun', balance: 50000, currency: 'RSD' }] },
    }).as('getAccounts');

    loginAs(clientWithTrading, '/otc');
    cy.wait('@getPublic');
    cy.contains('button', 'Sklopljeni ugovori').click();
    cy.wait('@getContracts');
  });

  it('podrazumevano prikazuje filter Važeći ugovori', () => {
    cy.contains('button', 'Važeći ugovori').should('be.visible');
    cy.contains('button', 'Istekli ugovori').should('be.visible');
  });

  it('filtrira po statusu važeći — vidi samo ugovore čiji settlementDate nije prošao', () => {
    cy.contains('button', 'Važeći ugovori').click();
    cy.contains('td', 'VALID').should('be.visible');
    cy.contains('td', 'EXPIRED').should('not.exist');
    cy.contains('td', 'EXERCISED').should('not.exist');
  });

  it('za svaki važeći ugovor postoji dugme Iskoristi', () => {
    cy.contains('button', 'Važeći ugovori').click();
    cy.contains('tr', 'VALID').within(() => {
      cy.contains('button', 'Iskoristi').should('be.visible');
    });
  });

  it('filtriranje na istekle ugovore prikazuje samo expajrane', () => {
    cy.contains('button', 'Istekli ugovori').click();
    cy.contains('td', 'EXPIRED').should('be.visible');
    cy.contains('td', 'VALID').should('not.exist');
  });

  it('ugovor sa statusom EXERCISED nije vidljiv ni u jednom filteru', () => {
    cy.contains('button', 'Važeći ugovori').click();
    cy.contains('td', 'EXERCISED').should('not.exist');

    cy.contains('button', 'Istekli ugovori').click();
    cy.contains('td', 'EXERCISED').should('not.exist');
  });
});
