describe('Scenario 56: Filtriranje ordera po statusu Pending', () => {
    it('kada supervizor izabere filter Pending, prikazuju se samo Pending orderi', () => {
        cy.loginAsAdmin();

        // idi na Orders iz navbara
        cy.visit('/supervisor/orders');

        // klik filter dugme
      //  cy.contains('button', /^Pending$/i, { timeout: 20000 }).click();


    });
});