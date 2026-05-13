/**
 * Scenario 3 – SAGA pattern: Rollback on failed share reservation
 *
 * Given  buyer has enough funds
 * And    seller no longer owns the required shares
 * When   buyer exercises a valid OTC contract
 * Then   funds reservation succeeds
 * And    share reservation fails
 * And    the SAGA transaction is marked as FAILED
 * And    reserved funds are released
 * And    the user sees an error message
 */

describe('Scenario 3: SAGA – Rollback on failed share reservation', () => {
  beforeEach(() => {
    cy.loginAsMarko();

    cy.visit('/otc');

    cy.contains('h1', 'OTC Ponude i Ugovori', {
      timeout: 10000,
    }).should('be.visible');
  });

  it('fails after successful funds reservation because seller lacks shares', () => {

    // ── intercept REAL backend request (NO MOCK) ─────────────────────
    cy.intercept('POST', '**/otc/contracts/*/exercise').as('exercise');

    // ── open contracts tab ────────────────────────────────────────────
    cy.contains('button', 'Sklopljeni ugovori')
      .should('be.visible')
      .click();

    cy.contains('h2', 'Sklopljeni ugovori')
      .should('be.visible');

    // ── valid contracts filter ────────────────────────────────────────
    cy.contains('button', 'Važeći ugovori').click();

    // ── locate known failing contract ─────────────────────────────────
    cy.get('table tbody tr')
      .filter(':contains("UFG"):contains("1.017")')
      .first()
      .contains('button', 'Iskoristi')
      .click();

    // ── modal visible ─────────────────────────────────────────────────
    cy.contains('h3', 'Iskoristi opciju')
      .should('be.visible');

    // ── select payment account ────────────────────────────────────────
    cy.get('select:visible').then(($select) => {

      const nonEmpty = [...$select[0].querySelectorAll('option')]
        .filter(
          (o) => (o as HTMLOptionElement).value !== ''
        );

      expect(nonEmpty.length).to.be.greaterThan(0);

      cy.wrap($select).select(
        (nonEmpty[0] as HTMLOptionElement).value
      );
    });

    // ── trigger SAGA execution ────────────────────────────────────────
    cy.contains('button', 'Potvrdi')
      .should('not.be.disabled')
      .click();

    // ── verify REAL backend SAGA response ─────────────────────────────

    cy.wait('@exercise').then(({ response }) => {

      expect(response?.body?.status)
        .to.eq('FAILED');

      expect(response?.body?.current_step)
        .to.eq('FUNDS_RESERVED');

      expect(response?.body?.last_error)
        .to.contain(
          'seller no longer has enough shares'
        );
    });

    // ── UI shows rollback failure ─────────────────────────────────────
    cy.contains(
      'seller no longer has enough shares',
      { timeout: 20000 }
    ).should('be.visible');

    // ── modal remains open ────────────────────────────────────────────
    cy.contains('h3', 'Iskoristi opciju')
      .should('be.visible');

    // ── success banner must NOT appear ────────────────────────────────
    cy.contains(/je uspešno iskorišćena/i)
      .should('not.exist');

    // ── confirm button enabled again after rollback ───────────────────
    cy.contains('button', 'Potvrdi')
      .should('not.be.disabled');
  });
});