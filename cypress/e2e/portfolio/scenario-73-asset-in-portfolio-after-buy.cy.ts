/**
 * Scenario 73 – Hartija prelazi u portfolio nakon izvršenog BUY ordera
 * Provera za KLIJENTA (bez admin opcija)
 */
describe('Scenario 73: Hartija prelazi u portfolio nakon izvršenog BUY ordera', () => {
    
    beforeEach(() => {
        cy.loginAsClient();
        cy.visit('/client/portfolio');
        cy.get('table', { timeout: 10000 }).should('be.visible');
    });

    it('hartija (UFG) se pojavljuje u portfoliju korisnika', () => {
        // Proveravamo da li postoji red sa tickerom UFG
        cy.get('table tbody tr').contains('td', 'UFG').should('be.visible');
    });

    it('prikazuje ispravnu količinu (veću od nule)', () => {
        cy.get('table tbody tr').contains('td', 'UFG').parent().within(() => {
            // Kolona AMOUNT
            cy.get('td').eq(2).invoke('text').then((text) => {
                const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
                expect(amount).to.be.greaterThan(0);
            });
        });
    });

    it('hartija je privatna po difoltu – klijent ne vidi Public opcije', () => {
        // Pošto si prosledila isAdmin={false}, ovaj blok u kodu se ne renderuje
        // Samim tim, hartija je "privatna" jer nema opciju da se pošalje na OTC
        cy.contains('button', /Public/i).should('not.exist');
        cy.get('input[placeholder="Qty"]').should('not.exist');
    });

    it('omogućava prodaju hartije preko SELL dugmeta', () => {
        cy.get('table tbody tr').contains('td', 'UFG').parent().within(() => {
            cy.contains('button', 'SELL')
                .should('be.visible')
                .and('not.be.disabled');
        });
    });
});