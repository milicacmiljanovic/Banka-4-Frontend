/// <reference types="cypress" />
/// <reference path="./globals.d.ts" />
// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
// cypress/support/e2e.ts
require('./commands');

// Setup cy.server() globally before each test so routes can be configured
beforeEach(() => {
  cy.server();
});