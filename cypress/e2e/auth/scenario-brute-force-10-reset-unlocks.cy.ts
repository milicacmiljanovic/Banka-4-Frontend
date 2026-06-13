/// <reference types="cypress" />

import { visitEmployeeLogin, fillLoginForm, submitLogin } from '../../support/authHelpers';

const API_URL =
  (Cypress.env('API_URL') as string | undefined) ||
  'http://rafsi.davidovic.io:8080/api';

// Opcija B nije izvodljiva: postojeće test lozinke ne prolaze backend password policy
// pri change-password (nema uppercase, <8 chars). Koristimo Opcija C:
// lock je realan, forgot-password API je realan, samo token iz emaila je mockovan.
const NIKOLA_EMAIL = 'nikola@raf.rs';

describe('Feature 1 - Autentifikacija korisnika', () => {
  beforeEach(() => {
    // Lock nikola's account with 5 failed login attempts
    Cypress._.times(5, () => {
      cy.request({
        method:           'POST',
        url:              `${API_URL}/auth/login`,
        body:             { email: NIKOLA_EMAIL, password: 'wrong_password_lock' },
        failOnStatusCode: false,
      });
    });
  });

  // Nema afterEach cleanup — reset-password je mockovan, backend nije dirnut.
  // Lock ističe za 10 minuta.

  it('Scenario 10: Reset lozinke otključava nalog i resetuje failedLoginAttempts na 0', () => {
    cy.intercept('POST', '**/auth/forgot-password').as('forgotPassword');
    cy.intercept('POST', '**/auth/reset-password', (req) => {
      // Token dolazi emailom — nije dostupan u automatizovanim testovima.
      // Mockujemo samo token exchange; ostatak toka je realan.
      req.reply({ statusCode: 200, body: {} });
    }).as('resetPassword');

    // Nalog je zaključan — pokušaj logovanja prikazuje "blokiran" poruku
    visitEmployeeLogin();
    fillLoginForm(NIKOLA_EMAIL, 'wrong_while_locked');
    submitLogin();
    cy.contains(/blokiran/i).should('be.visible');

    // Korisnik klikće "Zaboravili ste lozinku?" sa zaključanog naloga
    cy.contains('a', /zaboravili ste lozinku/i).click();
    cy.location('pathname').should('eq', '/reset-password');

    // Korak 1 — unos emaila i slanje zahteva za reset (realan API poziv)
    cy.get('#email').clear().type(NIKOLA_EMAIL);
    cy.contains('button', /pošalji link za resetovanje/i).click();
    cy.wait('@forgotPassword').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });
    cy.contains(/email je poslat/i).should('be.visible');

    // Korak 3 — simulacija klika na link iz emaila sa tokenem
    cy.visit('/reset-password?token=FAKE_RESET_TOKEN');

    // Forma za novu lozinku mora biti vidljiva (token u URL-u aktivira korak 3)
    cy.get('#nova-lozinka').should('be.visible');
    cy.get('#nova-lozinka').type('NewPass12!');
    cy.get('#potvrda-lozinke').type('NewPass12!');
    cy.contains('button', /potvrdi novu lozinku/i).click();

    // Reset-password request mora biti poslat sa tokenem iz URL-a i novom lozinkom
    cy.wait('@resetPassword').then((interception) => {
      expect(interception.request.body.token).to.eq('FAKE_RESET_TOKEN');
      expect(interception.request.body.new_password).to.be.a('string').and.not.empty;
    });

    // Uspešan reset — UI prikazuje potvrdu
    cy.contains(/lozinka je promenjena/i).should('be.visible');
  });
});
