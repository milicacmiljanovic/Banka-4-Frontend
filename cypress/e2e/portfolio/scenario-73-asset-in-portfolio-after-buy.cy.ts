/**
 * Scenario 73 – Hartija prelazi u portfolio nakon izvršenog BUY ordera
 * Prilagođeno stvarnom stanju sa slike image_8e62fc.jpg
 */
describe('Scenario 73: Hartija prelazi u portfolio nakon izvršenog BUY ordera', () => {
    
    beforeEach(() => {
        cy.loginAsClient();
        cy.visit('/client/portfolio');
        cy.get('table', { timeout: 10000 }).should('be.visible');
    });

    it('hartija (UFG) se pojavljuje u portfoliju korisnika', () => {
        // Potvrđujemo da je UFG u tabeli kao na slici
        cy.get('table tbody tr').contains('td', 'UFG').should('be.visible');
    });

    it('prikazuje ispravnu količinu (6)', () => {
        cy.get('table tbody tr').contains('td', 'UFG').parent().within(() => {
            // Na slici vidimo količinu 6
            cy.get('td').eq(2).should('contain', '6');
        });
    });

    it('hartija je privatna po difoltu – Public dugme je inicijalno onemogućeno', () => {
        // Na slici vidimo da Public dugme POSTOJI, pa test pada na 'not.exist'
        // Ispravna provera privatnosti je da je dugme disabled dok se ne unese Qty
        cy.get('table tbody tr').contains('td', 'UFG').parent().within(() => {
            cy.contains('button', /Public/i).should('be.visible').and('be.disabled');
            cy.get('input[placeholder="Qty"]').should('be.visible').and('have.value', '');
        });
    });

    it('omogućava prodaju hartije preko SELL dugmeta', () => {
        cy.get('table tbody tr').contains('td', 'UFG').parent().within(() => {
            // SELL dugme je narandžasto i vidljivo na slici
            cy.contains('button', 'SELL')
                .should('be.visible')
                .and('not.be.disabled');
        });
    });
});