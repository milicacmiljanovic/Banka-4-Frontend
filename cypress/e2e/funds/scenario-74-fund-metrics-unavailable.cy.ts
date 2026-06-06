// Scenario 74: Metrike se ne prikazuju bez dovoljno podataka
// Koristi prave podatke iz trading-service (port 8082)
// U bazi postoje fondovi (fund_id 3 i 4) koji su tek kreirani i nemaju
// performance_history → backend ne može da izračuna metrike → vraća null polja.
// Read-only test — nema izmena baze, nema potrebe za cleanup-om

const AUTH_API    = 'http://rafsi.davidovic.io:8080/api';
const TRADING_API = 'http://rafsi.davidovic.io:8082/api';

describe('Scenario 74: Metrike se ne prikazuju bez dovoljno podataka', () => {
  before(() => {
    cy.request('POST', `${AUTH_API}/auth/login`, {
      email: 'admin@raf.rs',
      password: 'admin123',
    }).then((res) => {
      expect(res.status).to.eq(200);

      // Potvrdi da u bazi postoji fond bez metrika (annual_return == null)
      cy.request({
        method: 'GET',
        url: `${TRADING_API}/investment-funds`,
        headers: { Authorization: `Bearer ${res.body.token}` },
      }).then((fundsRes) => {
        const funds = fundsRes.body?.data ?? fundsRes.body ?? [];
        const noMetrics = funds.filter(
          (f: any) => f.annual_return == null && f.annualReturn == null
        );
        expect(
          noMetrics.length,
          'U bazi mora postojati bar jedan fond bez metrika (tek kreiran)'
        ).to.be.greaterThan(0);
        cy.wrap(noMetrics[0].name ?? noMetrics[0].fund_name).as('fundNoMetricsName');
      });
    });
  });

  beforeEach(() => {
    cy.loginAsClient();
    cy.visit('/investment-funds');
    cy.get('table', { timeout: 15000 }).should('be.visible');
  });

  it('fond bez istorijskih podataka prikazan je u tabeli', () => {
    cy.get<string>('@fundNoMetricsName').then((name) => {
      cy.contains('tbody tr', name).should('be.visible');
    });
  });

  it('metrike za tek kreiran fond su prikazane kao nedostupne ili prazne', () => {
    cy.get<string>('@fundNoMetricsName').then((name) => {
      cy.contains('tbody tr', name).within(() => {
        cy.get('td').then(($cells) => {
          const texts = [...$cells].map((c) => c.textContent?.trim() ?? '');
          const hasUnavailable = texts.some(
            (t) => t === '' || t === '—' || t === '-' || /n\/a|nema|nedostupno/i.test(t)
          );
          expect(
            hasUnavailable,
            'Bar jedna ćelija metrike treba biti prikazana kao nedostupna'
          ).to.be.true;
        });
      });
    });
  });

  it('ćelije metrika ne prikazuju decimalne vrednosti za fond bez podataka', () => {
    cy.get<string>('@fundNoMetricsName').then((name) => {
      cy.contains('tbody tr', name).within(() => {
        cy.get('td').each(($td) => {
          const text = $td.text().trim();
          // Decimalni broj koji bi bio metrika (npr. 73,33 ili 14,07) ne sme da postoji
          expect(text).not.to.match(/^-?\d{1,3}[,.]\d{2,}%?$/);
        });
      });
    });
  });
});
