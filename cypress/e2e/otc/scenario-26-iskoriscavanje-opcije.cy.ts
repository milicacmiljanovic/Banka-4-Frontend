describe('Scenario 26: Iskorišćavanje važećeg opcionog ugovora po SAGA patternu', () => {
  const TRADING_API_URL = 'http://rafsi.davidovic.io:8082/api';

  beforeEach(() => {
    cy.intercept('GET', '**/api/otc/contracts*').as('getContracts');
    // SAGA pattern obično podrazumeva POST ili PATCH na exercise endpoint
    cy.intercept('POST', '**/api/otc/contracts/*/exercise').as('exerciseOption');
    cy.intercept('GET', '**/api/clients/*/accounts').as('getAccounts');

    cy.loginAsClient(); 
    cy.visit('/otc');
  });

it('uspešno iskorišćava opciju uz vizuelnu proveru', () => {
    cy.contains('button', /Sklopljeni ugovori/i).click({ force: true });
    
    // Čekamo da se tabela učita i pravimo malu pauzu da vidimo podatke
    cy.wait('@getContracts');
    cy.wait(1000); // Vizuelna pauza

    // 1. Klik na Iskoristi i logovanje akcije
    cy.get('table tbody tr').first().within(() => {
      cy.get('button').contains(/Iskoristi/i).click();
    });
    cy.log('Kliknuto na dugme Iskoristi');

    // 2. Pauza da vidiš da li se modal otvorio (image_e345d2.jpg)
    cy.wait(1000); 
    cy.contains('div', /Iskoristi opciju/i).should('be.visible');

    // 3. Izbor računa - ovde test često puca ako se ne sačeka
    cy.contains('label', /Račun za plaćanje/i)
      .parent()
      .find('select')
      .select(1);
    
    cy.log('Račun selektovan, čekam 1.5s pre potvrde...');
    cy.wait(1500); // Daje ti vremena da vidiš selektovan račun u modalu

    // 4. Klik na Potvrdi (image_e345d2.jpg)
    cy.contains('button', /^Potvrdi$/i).click();

    // 5. Čekanje na API i provera zelene poruke (image_e3416f.jpg)
    cy.wait('@exerciseOption').then((interception) => {
       cy.log('API Status:', interception.response?.statusCode);
    });

    // Dodajemo duži wait ovde da bi stigao da vidiš zeleni banner na vrhu
    cy.wait(2000); 
    
    // Provera poruke o uspehu koja se vidi na image_e3416f.jpg
    cy.get('body').then(($body) => {
      if ($body.text().includes('uspešno iskorišćena')) {
        cy.log('POTVRDA: Zelena poruka je vidljiva!');
      }
    });

    cy.contains(/uspešno iskorišćena/i).should('be.visible');
    
    // Finalna pauza pre zatvaranja testa
    cy.wait(3000); 
  });
});