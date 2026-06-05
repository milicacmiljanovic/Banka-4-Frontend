/// <reference types="cypress" />

describe('Scenario 19: Kupac prihvata ponudu', () => {
  const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
  const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

  const MARKO_EMAIL    = 'marko.markovic@example.com';
  const MARKO_PASSWORD = 'password123';

  let authToken: string;
  let acceptedOfferId: number | null = null;

  before(() => {
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: MARKO_EMAIL,
      password: MARKO_PASSWORD,
    }).then((res) => {
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    acceptedOfferId = null;
    cy.loginAsClient(); 
    cy.visit('/otc');
  });

  afterEach(() => {
    if (!acceptedOfferId) return;
    cy.request({
      method: 'PATCH',
      url: `${TRADING_SERVICE_URL}/otc/offers/${acceptedOfferId}/reject`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false
    });
  });

  it('kupac uspešno prihvata ponudu', () => {
    cy.intercept('GET', '**/api/otc/offers/active*').as('getOffers');
    cy.intercept('PATCH', '**/api/otc/offers/*/accept').as('acceptOffer');

    cy.contains('button', /Aktivne ponude/i).click();

    cy.wait('@getOffers').then((interception) => {
      const offers = interception.response?.body;
      const validOffer = offers.find((o: any) => o.otc_offer_id !== undefined);
      
      expect(validOffer, 'Nema aktivnih ponuda').to.not.be.undefined;
      
      acceptedOfferId = validOffer.otc_offer_id;
      cy.contains('tr', acceptedOfferId).find('button').contains(/Detalji/i).click();
    });

    // 5. IZBOR RAČUNA (sada koristimo ispravan select selektor)
// 5. IZBOR RAČUNA
    // Prvo nalazimo labelu i njenog roditelja da dobijemo kontekst
    cy.contains('label', /Vaš račun za naplatu/i)
      .parent()
      .find('select')
      .as('racunSelect'); // Čuvamo kao alias za lakšu upotrebu

    // KLIKNI NA SELECT (ovo otvara listu u većini browsera)
   // cy.get('@racunSelect').click({ force: true });

    // SADA IZABERI VREDNOST
    cy.get('@racunSelect')
      .select('444000112345678921');

    // 6. PRIHVATI
    cy.contains('button', /^Prihvati$/i).should('be.visible').click();

    // 7. PROVERA
    cy.wait('@acceptOffer').then((interception) => {
      // Ako ovde i dalje dobijaš 400, backend odbija ovaj račun.
      // Proveri u Network tabu šta tačno backend kaže u odgovoru.
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });
    
    cy.contains(/Ponuda je uspešno prihvaćena/i).should('be.visible');
  });
});