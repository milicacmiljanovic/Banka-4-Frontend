import { clientWithTrading, loginAs, buildPublicListing } from './helpers';

describe('Scenario 14: Klijent sa permisijom za trgovinu vidi OTC portal', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/public*', {
      statusCode: 200,
      body: [
        buildPublicListing({ asset_ownership_id: 1, ticker: 'AAPL', name: 'Apple Inc.', owner_name: 'Marko Marković', available_amount: 100, price: 180.50 }),
        buildPublicListing({ asset_ownership_id: 2, ticker: 'MSFT', name: 'Microsoft Corp.', owner_name: 'Ana Anić', available_amount: 50, price: 415.20 }),
      ],
    }).as('getPublicListings');

    cy.intercept('GET', '**/clients/*/accounts*', {
      statusCode: 200,
      body: { data: [] },
    }).as('getAccounts');

    loginAs(clientWithTrading, '/otc');
  });

  it('vidi naslov i tab za dostupne akcije', () => {
    cy.wait('@getPublicListings');
    cy.contains('h1', 'OTC Ponude i Ugovori').should('be.visible');
    cy.contains('button', 'Dostupne akcije').should('be.visible');
  });

  it('vidi listu akcija u javnom režimu', () => {
    cy.wait('@getPublicListings');
    cy.contains('td', 'AAPL').should('be.visible');
    cy.contains('td', 'MSFT').should('be.visible');
  });

  it('tabela ima kolone identične Portalu za Hartije od vrednosti', () => {
    cy.wait('@getPublicListings');
    cy.get('thead th').then(($ths) => {
      const headers = [...$ths].map(th => th.textContent?.trim().toUpperCase());
      expect(headers).to.include.members(['TICKER', 'NAZIV', 'VLASNIK', 'DOSTUPNO', 'CENA']);
    });
  });

  it('prikazuje vlasnika i dostupnu količinu za svaku akciju', () => {
    cy.wait('@getPublicListings');
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('Marko Marković').should('be.visible');
      cy.contains('100').should('be.visible');
    });
  });

  it('dugme Pošalji ponudu postoji za svaku akciju', () => {
    cy.wait('@getPublicListings');
    cy.contains('tr', 'AAPL').within(() => {
      cy.contains('button', 'Pošalji ponudu').should('be.visible');
    });
    cy.contains('tr', 'MSFT').within(() => {
      cy.contains('button', 'Pošalji ponudu').should('be.visible');
    });
  });
});
