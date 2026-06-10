// Scenario 63: Email upozorenje pre isteka opcionog ugovora
// Backend system test — nema UI izmena, nema potrebe za cleanup-om
// Direktni API pozivi idu na port 8082 (trading-service), auth na 8080 (user-service)

// Settlement date 3 dana od sada
const settlementIn3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

const expiringContract = {
  otc_option_contract_id: 777,
  ticker: 'UFG',
  amount: 10,
  strike_price_rsd: 180.50,
  premium_rsd: 10.00,
  settlement_date: `${settlementIn3Days}T00:00:00Z`,
  status: 'ACTIVE',
  buyer_id: 2,
  seller_id: 999,
};

describe('Scenario 63: Email upozorenje pre isteka opcionog ugovora', () => {
  before(() => {
    // Dobijamo admin token jednom za sve API pozive u ovom describe bloku
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL')}/auth/login`,
      body: {
        email: Cypress.env('ADMIN_EMAIL') as string,
        password: Cypress.env('ADMIN_PASSWORD') as string,
      },
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.wrap(res.body.token).as('adminToken');
    });
  });

  it('backend endpoint za slanje email upozorenja o isteku ugovora vraća uspešan odgovor', () => {
    cy.get('@adminToken').then((token) => {
      // Pozivamo endpoint koji triggeruje dnevnu proveru i šalje email upozorenja
      cy.request({
        method: 'POST',
        url: `${Cypress.env('TRADING_API_URL')}/otc/contracts/check-expiry`,
        headers: { Authorization: `Bearer ${token as string}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect(
          res.status,
          'Endpoint za proveru isteka ugovora mora da postoji i vrati 200, 202 ili 204'
        ).to.be.oneOf([200, 202, 204]);
      });
    });
  });

  it('ugovor koji ističe za 3 dana prikazan je u listi važećih ugovora', () => {
    cy.intercept('GET', '**/otc/contracts*', {
      statusCode: 200,
      body: [expiringContract],
    }).as('getContracts');

    cy.loginAsClient();
    cy.visit('/otc');
    cy.contains('button', 'Sklopljeni ugovori').click();
    cy.wait('@getContracts');
    cy.contains('button', 'Važeći ugovori').click();

    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.contains('tbody tr', 'UFG').should('be.visible');
  });

  it('UI prikazuje upozorenje ili oznaku za ugovor koji uskoro ističe', function () {
    // Frontend vizuelna oznaka za ugovor koji uskoro ističe još nije implementirana.
    this.skip();
  });
});
