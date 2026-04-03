export function fieldRootByLabel(labelText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // labelText može biti npr. "Ime" (matchuje i "Ime *")
    return cy.contains('label', labelText).parent();
}

export function fillInputByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('input')
        .first()
        .clear({ force: true })
        .type(value, { force: true });
}

export function fillDateByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('input[type="date"]')
        .first()
        .clear({ force: true })
        .type(value, { force: true });
}

export function selectByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('select')
        .first()
        .select(value, { force: true });
}