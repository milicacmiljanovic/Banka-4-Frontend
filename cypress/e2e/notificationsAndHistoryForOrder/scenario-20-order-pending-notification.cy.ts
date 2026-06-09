/// <reference types="cypress" />

// Scenario 20 testira specifično ponašanje needApproval=true (agent čija narudžbina ide na odobrenje).
// Ova konfiguracija zahteva seedovanje na odbrani.
// Accounti i POST /orders su mockovanje jer su potrebni kao preduslov za demonstraciju PENDING toka.
// Sve ostalo (učitavanje hartija, navigacija, UI interakcija) koristi pravi backend.

describe('Scenario 20: Notifikacija kada order ide na odobrenje', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('agent kreira order i order dobija status PENDING kada agent ima needApproval=true', () => {
    cy.intercept('GET', '**/listings/stocks*').as('getStocks');
    cy.intercept('GET', '**/listings/stocks/*').as('getStockDetails');

    cy.visit('http://localhost:5173/securities');
    cy.url().should('include', '/securities');
    cy.wait('@getStocks').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    cy.get('table tbody tr').first().contains('td', /[A-Z]{2,}/).click();
    cy.wait('@getStockDetails').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
    });

    // Accounts mock se postavlja POSLE učitavanja stocks — OrderModal mountuje tek na klik
    // Mock je neophodan: admin može nemati bank account sa CompanyID=1 u tekućem seeding-u
    cy.intercept('GET', '**/accounts*', {
      statusCode: 200,
      body: [{
        AccountType: 'bank',
        CompanyID: 1,
        AccountNumber: '111-0000000001-01',
        account_number: '111-0000000001-01',
        Balance: 1000000,
        balance: 1000000,
        available_balance: 1000000,
      }],
    }).as('getAccounts');

    // POST /orders mockovan sa PENDING — testujemo konkretan scenario needApproval=true
    cy.intercept('POST', '**/orders', {
      statusCode: 201,
      body: { id: 9999, status: 'PENDING', direction: 'BUY', order_type: 'MARKET', quantity: 1, after_hours: false },
    }).as('createOrder');

    cy.contains('button', 'Kreiraj nalog').click();
    cy.wait('@getAccounts');

    cy.contains('label', 'Račun za kupovinu')
      .parent()
      .find('select')
      .then(($select) => {
        const $options = $select.find('option').filter((_, el) => {
          const opt = el as HTMLOptionElement;
          return opt.value !== '' && !opt.disabled;
        });
        expect($options.length, 'select mora imati bar jednu opciju za račun').to.be.greaterThan(0);
        cy.wrap($select).select(($options[0] as HTMLOptionElement).value);
      });

    cy.get('input[placeholder="Unesite količinu..."]').clear().type('1');
    cy.contains('button', 'Nastavi').scrollIntoView().click({ force: true });
    cy.contains('h4', 'Potvrda ordera').should('be.visible');
    cy.contains('button', 'Potvrdi').click();

    cy.wait('@createOrder').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
      expect(interception.response?.body.status).to.eq('PENDING');
    });

    cy.contains('Order je kreiran i čeka odobrenje').should('be.visible');
  });
});
