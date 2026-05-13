/**
 * Scenario 2 – SAGA pattern: Rollback on failed funds reservation
 *
 * Given  buyer (Marko) does not have enough funds
 * And    a valid OTC contract exists for Marko (UFG, amount: 1, strike price: 1.017)
 * When   buyer initiates OTC option exercise
 * Then   the SAGA fails at the funds reservation step
 * And    the backend returns a FAILED status with last_error
 * And    an error message is displayed inside the exercise modal
 * And    the success banner is NOT shown
 * And    the modal remains open
 */
describe('Scenario 2: SAGA – Rollback on failed funds reservation', () => {
  beforeEach(() => {
    cy.loginAsMarko();
    cy.visit('/otc');
    cy.contains('h1', 'OTC Ponude i Ugovori', { timeout: 10000 }).should('be.visible');
  });

  it('exercise fails due to insufficient funds and error is shown in modal', () => {
    // ── 1. Open the "Sklopljeni ugovori" tab ─────────────────────────────────
    cy.contains('button', 'Sklopljeni ugovori').should('be.visible').click();
    cy.contains('h2', 'Sklopljeni ugovori', { timeout: 10000 }).should('be.visible');

    // ── 2. Activate the valid-contracts filter ────────────────────────────────
    cy.contains('button', 'Važeći ugovori').click();

    // ── 3. Wait for backend to return at least one valid contract ─────────────
    cy.get('table tbody tr', { timeout: 15000 }).should('have.length.at.least', 1);

    // ── 4. Locate the UFG contract (strike price 1.017) and open exercise modal
    cy.get('table tbody tr')
      .filter(':contains("UFG"):contains("1.017")')
      .first()
      .contains('button', 'Iskoristi')
      .click();

    // ── 5. Confirm exercise modal appears ─────────────────────────────────────
    cy.contains('h3', 'Iskoristi opciju').should('be.visible');

    // ── 6. Select the first available payment account ─────────────────────────
    cy.get('select:visible').then(($select) => {
      const nonEmpty = [...$select[0].querySelectorAll('option')].filter(
        (o) => (o as HTMLOptionElement).value !== ''
      );
      if (nonEmpty.length === 0) {
        throw new Error(
          'No payment accounts loaded in the exercise modal. ' +
          'Verify that Marko has at least one account on the backend.'
        );
      }
      cy.wrap($select).select((nonEmpty[0] as HTMLOptionElement).value);
    });

    // ── 7. Submit the exercise ────────────────────────────────────────────────
    cy.contains('button', 'Potvrdi').should('not.be.disabled').click();

    // ── 8. SAGA failure: wait for error to appear (backend returns FAILED status)
    //       The error <p> renders result.last_error or the fallback message.
    //       Timeout matches the SAGA round-trip time.
    cy.get('[class*="errorText"]', { timeout: 20000 }).should('be.visible').and('not.be.empty');

    // ── 9. Modal remains open after failed exercise ───────────────────────────
    cy.contains('h3', 'Iskoristi opciju').should('be.visible');

    // ── 10. Confirm button re-enabled (exerciseLoading cleared in finally block)
    cy.contains('button', 'Potvrdi').should('not.be.disabled');

    // ── 11. Success banner is NOT shown ──────────────────────────────────────
    cy.contains(/je uspešno iskorišćena/i).should('not.exist');
  });
});
