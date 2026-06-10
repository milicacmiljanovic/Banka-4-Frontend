/// <reference types="cypress" />

export {};

describe('Scenario 71: Admin može da iskoristi opciju koja je in-the-money', () => {

  const USER_SERVICE_URL = Cypress.env('API_URL') as string;
  const TRADING_SERVICE_URL = Cypress.env('TRADING_API_URL') as string;

  let authToken: string;
  let exercisedOptionId: number | null = null;

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: Cypress.env('ANA_EMAIL') as string,
      password: Cypress.env('ANA_PASSWORD') as string,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    exercisedOptionId = null;

    cy.loginAsClientAna();

    cy.visit('/client/portfolio', {
      onBeforeLoad(win) {
        cy.stub(win, 'confirm').as('confirmStub').returns(true);
        cy.stub(win, 'alert').as('alertStub');
      },
    });

    cy.get('table', { timeout: 10000 }).should('be.visible');
  });

  afterEach(() => {
    if (!exercisedOptionId) return;

    cy.request({
      method: 'POST',
      url: `${TRADING_SERVICE_URL}/options/${exercisedOptionId}/cancel-exercise`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      cy.log(`Cleanup executed za opciju ${exercisedOptionId}. Status: ${res.status}`);
    });
  });

  it('prikazuje dugme EXERCISE za ITM opcije i proverava interakciju', () => {
    cy.intercept('POST', '**/options/**/exercise*').as('exerciseRequest');

    cy.get('table tbody tr').then(($rows) => {
      const itmRow = $rows.toArray().find(row =>
        row.innerText.includes('ITM') || row.innerText.includes('In The Money')
      );

      if (itmRow) {
        cy.wrap(itmRow).within(() => {
          cy.get('button').contains(/EXERCISE/i)
            .should('be.visible')
            .click({ force: true });
        });

        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Potvrdi")').length > 0) {
            cy.get('button').contains(/Potvrdi/i).click({ force: true });
          }
        });

        cy.wait('@exerciseRequest', { timeout: 8000 }).then((interception) => {
          const resBody = interception.response?.body ?? {};
          const optionId = resBody.option_id || resBody.id;
          if (optionId) {
            exercisedOptionId = optionId;
          }
        });
      } else {
        cy.log('Nema trenutno dostupnih ITM opcija u tabeli, test preskače klik.');
      }
    });
  });

  it('EXERCISE dugme nije prikazano za opcije koje nisu ITM', () => {
    cy.get('table tbody tr').each(($tr) => {
      const text = $tr.text();
      if (text.includes('OTM') || text.includes('Out of the Money')) {
        cy.wrap($tr).contains('button', /EXERCISE/i).should('not.exist');
      }
    });
  });
});
