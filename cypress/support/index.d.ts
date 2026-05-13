/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface cy {
      intercept(...args: any[]): Chainable<any>;
      wait(alias: string, options?: any): Chainable<any>;
      wait(alias: string[], options?: any): Chainable<any>;
    }

    interface Chainable<Subject = any> {
      loginAsClient(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsClientAna(): Chainable<void>;
      loginAsNikola(): Chainable<void>;
      loginAsJelena(): Chainable<void>;
    }
  }
}

export {};
