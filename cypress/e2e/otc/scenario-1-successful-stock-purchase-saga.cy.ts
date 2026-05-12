/**
 * Scenario 1 – SAGA pattern: Successful stock purchase
 *
 * Given  buyer (Ana) has enough funds on her account
 * And    seller owns the requested shares (valid OTC contract exists for Ana)
 * When   buyer initiates stock purchase by exercising an OTC option contract
 * Then   the system reserves buyer funds
 * And    the system reserves seller shares
 * And    funds are transferred from buyer to seller
 * And    ownership of shares is transferred to buyer
 * And    final state verification succeeds
 * And    transaction is marked as successful (success banner is displayed)
 * And    exercised contract disappears from valid contracts
 */
describe('Scenario 1: SAGA – Successful stock purchase via OTC exercise', () => {
  beforeEach(() => {
    cy.loginAsClientAna();
    cy.visit('/otc');
    cy.contains('h1', 'OTC Ponude i Ugovori', { timeout: 10000 }).should('be.visible');
  });

  it('buyer exercises a valid OTC contract and SAGA completes successfully', () => {
    // ── 1. Open the "Sklopljeni ugovori" tab ─────────────────────────────────
    cy.contains('button', 'Sklopljeni ugovori').should('be.visible').click();
    cy.contains('h2', 'Sklopljeni ugovori', { timeout: 10000 }).should('be.visible');

    // ── 2. Activate the valid-contracts filter (default, but explicit) ────────
    cy.contains('button', 'Važeći ugovori').click();

    // ── 3. Wait for the backend to return at least one valid contract ─────────
    cy.get('table tbody tr', { timeout: 15000 }).should('have.length.at.least', 1);

    // ── 4. Remember row count to verify removal after exercise ────────────────
    cy.get('table tbody tr').its('length').as('rowCountBefore');

    // ── 5. Initiate exercise on the first valid contract ──────────────────────
    cy.get('table tbody tr').first().contains('button', 'Iskoristi').click();

    // ── 6. Confirm modal appears ──────────────────────────────────────────────
    cy.contains('h3', 'Iskoristi opciju').should('be.visible');

    // ── 7. Select the first available payment account ─────────────────────────
    cy.get('select:visible').then(($select) => {
      const nonEmpty = [...$select[0].querySelectorAll('option')].filter(
        (o) => (o as HTMLOptionElement).value !== ''
      );
      if (nonEmpty.length === 0) {
        throw new Error(
          'No payment accounts loaded in the exercise modal. ' +
          'Verify that Ana has at least one account on the backend.'
        );
      }
      cy.wrap($select).select((nonEmpty[0] as HTMLOptionElement).value);
    });

    // ── 8. Submit the exercise ────────────────────────────────────────────────
    cy.contains('button', 'Potvrdi').should('not.be.disabled').click();

    // ── 9. SAGA success: full transaction chain executed ──────────────────────
    //       Backend reserves funds → reserves shares → transfers funds
    //       → transfers ownership → marks contract EXERCISED
    cy.contains(/je uspešno iskorišćena/i, { timeout: 20000 }).should('be.visible');

    // ── 10. Modal closes after success ───────────────────────────────────────
    cy.contains('h3', 'Iskoristi opciju').should('not.exist');

    // ── 11. Exercised contract is removed from the valid-contracts list ───────
    cy.get<number>('@rowCountBefore').then((rowCountBefore) => {
     if (rowCountBefore === 1) {
     cy.contains(/Nema.*važećih ugovora/i).should('be.visible');
    } else {
     cy.get('table tbody tr').should('have.length', rowCountBefore - 1);
    }
    });
  });
});
