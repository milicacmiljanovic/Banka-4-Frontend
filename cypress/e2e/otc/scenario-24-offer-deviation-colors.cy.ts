// Scenario 24: Vizualizacija odstupanja u ponudama bojama
// Given postoje ponude sa različitim odstupanjima cene
// When  korisnik vidi ponude na stranici Aktivne ponude
// Then  ponude sa odstupanjem do 5% su zelene
// And   ponude sa odstupanjem 5% do 20% su žute
// And   ponude sa odstupanjem većim od 20% su crvene
//
// Tržišna cena dolazi kao current_price_rsd iz /otc/offers/active

const GREEN  = '220, 252, 231';
const YELLOW = '254, 249, 195';
const RED    = '254, 226, 226';

describe('Scenario 24: Vizualizacija odstupanja u ponudama bojama', () => {
  beforeEach(() => {
    cy.loginAsClient();
    cy.intercept('GET', '**/otc/offers/active').as('getOffers');
    cy.visit('/otc');
    cy.contains('button', 'Aktivne ponude').click();
    cy.wait('@getOffers').its('response.body').as('offersData');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('prikazuje tabelu sa aktivnim ponudama', () => {
    cy.get('table tbody tr').should('have.length.at.least', 1);
  });

  it('svaki red je obojen prema odstupanju od tržišne cene', () => {
    cy.get('@offersData').then((offers: any) => {
      cy.get('table tbody tr').each(($row, idx) => {
        const offer = offers[idx];
        if (!offer?.current_price || !offer?.price_per_stock_rsd) return;
        const dev = Math.abs(
          (offer.price_per_stock_rsd - offer.current_price) / offer.current_price
        ) * 100;
        const bg = Cypress.$($row).css('background-color');
        if (dev <= 5)        expect(bg, `red ${idx} (${dev.toFixed(1)}%)`).to.include(GREEN);
        else if (dev <= 20)  expect(bg, `red ${idx} (${dev.toFixed(1)}%)`).to.include(YELLOW);
        else                 expect(bg, `red ${idx} (${dev.toFixed(1)}%)`).to.include(RED);
      });
    });
  });
});

export {};
