// Scenario 16: Supervizor vidi OTC portal sa ponudama aktuara
// Given korisnik je ulogovan kao supervizor
// When  otvori portal "OTC Trgovina"
// Then  vidi ponude aktuara (ne klijenata)
// And   može kreirati ponudu za pregovor

import { loginAs, supervisorUser } from './helpers';

const actuaryStock = {
  asset_ownership_id: 55,
  ticker: 'UFG',
  name: 'Uni-Fuels Holdings Ltd',
  owner_name: 'Nikola Nikolic',
  available_amount: 100,
  price: 180.50,
};

const supervisorAccount = {
  accountNumber: '4440001123456789',
  name: 'Savings Account',
  balance: 35377888,
  currency: { code: 'RSD' },
};

describe('Scenario 16: Supervizor vidi OTC portal sa ponudama aktuara', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/otc/public', {
      statusCode: 200,
      body: [actuaryStock],
    }).as('getPublic');

    cy.intercept('GET', '**/clients/**/accounts', {
      statusCode: 200,
      body: [supervisorAccount],
    }).as('getAccounts');

    loginAs(supervisorUser, '/otc');
  });

  it('supervizor vidi OTC portal i naslov', () => {
    cy.contains('h1', 'OTC Ponude i Ugovori').should('be.visible');
  });

  it('supervizor vidi tab Dostupne akcije sa ponudama aktuara (ne klijenata)', () => {
    cy.wait('@getPublic');
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.contains('td', 'Nikola Nikolic').should('be.visible');
  });

  it('supervizor vidi sve tabove portala', () => {
    cy.contains('button', 'Dostupne akcije').should('be.visible');
    cy.contains('button', 'Aktivne ponude').should('be.visible');
    cy.contains('button', 'Sklopljeni ugovori').should('be.visible');
  });

  it('može kreirati ponudu za pregovor — ceo flow do uspešnog slanja', () => {
    cy.intercept('POST', '**/otc/offers', {
      statusCode: 201,
      body: { otc_offer_id: 201, ticker: 'UFG', status: 'ACTIVE' },
    }).as('createOffer');

    cy.wait('@getPublic');
    cy.wait('@getAccounts');

    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', 'Pošalji ponudu').click();
    });

    cy.contains('Make an Offer').should('be.visible');

    cy.get('input[placeholder="npr. 10"]').type('2');
    cy.get('input[placeholder="npr. 125.50"]').type('0.01');
    cy.get('input[type="date"]').type('2027-01-01');
    cy.get('input[placeholder="npr. 0"]').type('0.01');
    cy.get('select').select('4440001123456789');

    cy.contains('button', 'Make an Offer').click();
    cy.wait('@createOffer');

    cy.contains(/ponuda.*uspešno poslata/i).should('be.visible');
  });

  it('admin pošalje ponudu za stock zaposlenog → prikazuje grešku "the provided asset does not belong to a client"', () => {
    cy.intercept('POST', '**/otc/offers', {
      statusCode: 400,
      body: { message: 'the provided asset does not belong to a client' },
    }).as('createOfferFail');

    cy.wait('@getPublic');
    cy.wait('@getAccounts');

    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', 'Pošalji ponudu').click();
    });

    cy.get('input[placeholder="npr. 10"]').type('2');
    cy.get('input[placeholder="npr. 125.50"]').type('0.01');
    cy.get('input[type="date"]').type('2027-01-01');
    cy.get('input[placeholder="npr. 0"]').type('0.01');
    cy.get('select').select('4440001123456789');

    cy.contains('button', 'Make an Offer').click();
    cy.wait('@createOfferFail');

    cy.contains('the provided asset does not belong to a client').should('be.visible');
  });

  it('admin pošalje ponudu klijentu → prikazuje grešku "cannot send an offer to yourself"', () => {
    cy.intercept('POST', '**/otc/offers', {
      statusCode: 400,
      body: { message: 'cannot send an offer to yourself' },
    }).as('createOfferSelf');

    cy.wait('@getPublic');
    cy.wait('@getAccounts');

    cy.get('table tbody tr', { timeout: 10000 }).first().within(() => {
      cy.contains('button', 'Pošalji ponudu').click();
    });

    cy.get('input[placeholder="npr. 10"]').type('2');
    cy.get('input[placeholder="npr. 125.50"]').type('0.01');
    cy.get('input[type="date"]').type('2027-01-01');
    cy.get('input[placeholder="npr. 0"]').type('0.01');
    cy.get('select').select('4440001123456789');

    cy.contains('button', 'Make an Offer').click();
    cy.wait('@createOfferSelf');

    cy.contains('cannot send an offer to yourself').should('be.visible');
  });
});
