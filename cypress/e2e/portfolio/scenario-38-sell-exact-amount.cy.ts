/// <reference types="cypress" />

const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

const CLIENT_EMAIL    = 'ana.anic@example.com'; 
const CLIENT_PASSWORD = 'password123';

let authToken: string;
let createdOrderId: number | null = null;

describe('Scenario 38: Prodaja tačnog broja hartija', () => {

  before(() => {
    // Uzimamo token preko API-ja isključivo za afterEach čišćenje backenda
    cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
      email: CLIENT_EMAIL,
      password: CLIENT_PASSWORD,
    }).then((res) => {
      expect(res.status).to.eq(200);
      authToken = res.body.token;
    });
  });

  beforeEach(() => {
    createdOrderId = null;
    // Koristimo tvoju zvaničnu komandu iz commands.ts koja postavlja localStorage
    cy.loginAsClientAna();
    // Idemo direktno na portfolio stranicu
    cy.visit('/client/portfolio');
    cy.get('table').should('be.visible');
  });

  afterEach(() => {
    if (!createdOrderId) return;

    cy.request({
      method: 'POST',
      url: `${TRADING_SERVICE_URL}/orders/${createdOrderId}/cancel`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false
    }).then((res) => {
      cy.log(`Cleanup executed for order ${createdOrderId}. Status: ${res.status}`);
    });
  });

it('uspešno šalje order kada je količina jednaka posedovanoj', () => {
    // Presrećemo mrežni zahtev za slanje porudžbine
    cy.intercept('POST', '**/orders').as('realOrderRequest');

    cy.get('table').should('be.visible');

    // Dinamički nalazimo indeks kolone AMOUNT da bismo pročitali količinu
    cy.get('table th').then(($headers) => {
      const amountIndex = $headers.toArray().findIndex(th => th.innerText.includes('AMOUNT'));
      const finalIndex = amountIndex !== -1 ? amountIndex : 2; 

      // Uzimamo red za akciju CERS
      cy.contains('table tbody tr', 'CERS').then(($row) => {
          
          // Čitamo količinu (u ovom slučaju broj 1)
          const rawAmount = $row.find('td').eq(finalIndex).text().trim();
          const ownedAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));
          
          expect(ownedAmount, 'Količina mora biti validan broj').to.not.be.NaN;

          // 1. Klik na narandžasto SELL dugme za CERS
          cy.wrap($row).find('button').contains('SELL').click({ force: true });

          // MALA PAUZA: Sačekamo sekundu da se modal lepo iscrta
          cy.wait(1000);

          // 2. KLJUČNI KORAK: Biranje računa iz padajućeg menija
          // Pronalazimo select element (ili div ako je Custom Select/MUI/Radix) i biramo opciju
          cy.get('body').then(($body) => {
              // Ako je u pitanju standardni HTML <select> element
              if ($body.find('select').length > 0) {
                  // Biramo drugu opciju (indeks 1), jer je prva "Izaberite račun..."
                  cy.get('select').last().select(1, { force: true });
              } else {
                  // Ako je u pitanju custom dropdown (npr. klik na tekst pa biranje sa liste)
                  cy.contains(/Izaberite račun/i).click({ force: true });
                  cy.wait(500);
                  // Klikćemo na bilo koju ponuđenu opciju u otvorenoj listi
                  cy.get('[role="option"], li, div').filter(':visible').last().click({ force: true });
              }
          });

          // 3. Unosimo tačan ownedAmount u polje za količinu (polje sa placeholderom "Max: 1")
          cy.get('input[type="number"], input[placeholder*="Max"]').filter(':visible').first()
              .clear()
              .type(ownedAmount.toString(), { delay: 50 });

          // 4. Klik na crveno dugme "Nastavi" sa slike
          cy.contains('button', 'Nastavi').should('be.visible').click({ force: true });

          // 5. Potvrda porudžbine (sada će proći jer su sva polja popunjena!)
          // Pošto se nakon klika "Nastavi" verovatno otvara ekran sa dugmetom "Potvrdi" ili "Confirm"
          cy.get('body', { timeout: 5000 }).then(($body) => {
              if ($body.find('button:contains("Potvrdi")').length > 0 || $body.find('button:contains("Confirm")').length > 0) {
                  cy.get('button').contains(/Potvrdi|Confirm/i).click({ force: true });
              }
          });

          // 6. Čekamo odgovor sa pravog backenda i hvatamo ID porudžbine za afterEach cleanup
          cy.wait('@realOrderRequest', { timeout: 10000 }).then((interception) => {
              expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
              const resBody = interception.response?.body ?? {};
              const orderId = resBody.order_id ?? resBody.id;
              
              if (orderId) {
                  createdOrderId = orderId;
                  cy.log(`Uhvaćen order ID za cleanup: ${createdOrderId}`);
              }
          });

          // 7. Verifikacija da je modal uspešno zatvoren ili da je operacija prošla
          cy.get('body').then(($body) => {
              if ($body.text().includes('uspešno') || $body.text().includes('u obradi') || $body.text().includes('success')) {
                  cy.log('Poruka o uspehu uspešno verifikovana na ekranu!');
              } else {
                  cy.get('form').should('not.exist');
              }
          });
      });
    });
  });
});