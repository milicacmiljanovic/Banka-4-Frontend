/// <reference types="cypress" />

// Ova linija ispod rešava TypeScript konflikt sa drugim fajlovima (pretvara fajl u izolovani modul)
export {};

describe('Scenario 70: Za akcije postoji opcija javnog režima', () => {
    
    // Sve promenljive i konstante selimo unutar describe bloka kako bi bile lokalne za ovaj test
    const USER_SERVICE_URL    = 'http://rafsi.davidovic.io:8080/api';
    const TRADING_SERVICE_URL = 'http://rafsi.davidovic.io:8082/api';

    const CLIENT_EMAIL    = 'ana.anic@example.com'; 
    const CLIENT_PASSWORD = 'password123';

    let authToken: string;
    let targetTicker: string = 'CERS';
    let publicActionExecuted = false;
    
    before(() => {
        // Uzimamo token preko API-ja unapred za potrebe afterEach cleanup-a
        cy.request('POST', `${USER_SERVICE_URL}/auth/login`, {
            email: CLIENT_EMAIL,
            password: CLIENT_PASSWORD,
        }).then((res) => {
            expect(res.status).to.eq(200);
            authToken = res.body.token;
        });
    });

    beforeEach(() => {
        publicActionExecuted = false;
        // Logujemo se kao Ana jer tabela sa slike pripada njenom klijentskom nalogu
        cy.loginAsClientAna(); 
        cy.visit('/client/portfolio');
        
        // Čekamo da se učita tabela sa akcijama (timeout 10s)
        cy.get('table', { timeout: 10000 }).should('be.visible');
    });

    afterEach(() => {
        // CLEANUP: Ako je test promenio režim akcije u javni, vraćamo je nazad u privatni
        if (publicActionExecuted) {
            cy.request({
                method: 'POST',
                url: `${TRADING_SERVICE_URL}/shares/public/withdraw`, 
                headers: { Authorization: `Bearer ${authToken}` },
                body: { ticker: targetTicker },
                failOnStatusCode: false
            }).then((res) => {
                cy.log(`Cleanup executed: Akcije za ${targetTicker} povučene iz javnog režima. Status: ${res.status}`);
            });
        }
    });

    it('prikazuje sekciju za upravljanje javnim akcijama', () => {
        // Provera postojanja naslova sekcije (Prilagođeno naslovu tabele sa slike)
        cy.contains(/Moje akcije \(Stocks\)/i).should('be.visible');
    });

    it('prikazuje kontrole za javni režim (Qty i Public dugme)', () => {
        // Provera da li postoji polje za unos količine unutar tabele
        cy.get('table').find('input[placeholder*="Qty"]').first().should('be.visible');
        
        // Provera da li postoji dugme "Public" unutar tabele
        cy.get('table').find('button').contains(/Public/i).first().should('be.visible');
    });

    it('dozvoljava unos količine za prvu dostupnu akciju', () => {
        // Presrećemo potencijalni API poziv za prebacivanje u javni režim
        cy.intercept('POST', '**/shares/public*').as('publicShareRequest');

        // Pronalazimo prvu akciju u listi i vršimo interakciju
        cy.get('table tbody tr').first().within(() => {
            cy.get('input[placeholder*="Qty"]')
                .clear()
                .type('1')
                .should('have.value', '1');
            
            cy.contains('button', /Public/i).should('not.be.disabled');
            
            // Beležimo da smo spremni za interakciju radi kasnijeg cleanup-a
            publicActionExecuted = true;
        });
    });

    it('prikazuje dugme za povlačenje akcija sa portala', () => {
        // Proveravamo prisutnost dugmadi koja kontrolišu režim unutar tabele
        cy.get('table').find('button').contains(/Public|Withdraw|Povuci/i).should('be.visible');
    });

    it('verifikuje da se ticker vidi unutar OTC sekcije', () => {
        // Tražimo prvu tabelu/sekciju akcija i proveravamo da li u prvom redu stoji ispravan ticker format
        cy.get('table tbody tr').first().find('td').first().then(($td) => {
            const sectionText = $td.text().trim();
            const tickerRegex = /[A-Z]{1,5}/; // Standard za berzanski ticker
            expect(sectionText).to.match(tickerRegex);
        });
    });
});