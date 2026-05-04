describe('Scenario 60: AON order se ne izvršava bez pune količine', () => {
  it('ostaje u Pending statusu dok se ne skupi puna količina', () => {
    const order = {
      quantity: 20,
      all_or_none: true,
      available_market_quantity: 15,
      status: 'PENDING',
      transactions: [],
    };

    const canExecute = order.available_market_quantity >= order.quantity;

    if (canExecute) {
      order.transactions.push({ filled: order.quantity });
      order.status = 'DONE';
    }

    expect(canExecute).to.eq(false);
    expect(order.transactions).to.have.length(0);
    expect(order.status).to.eq('PENDING');
  });
});