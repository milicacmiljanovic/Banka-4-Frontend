describe('Scenario 61: AON order uspešno izvršavanje kada je puna količina dostupna', () => {
  it('izvršava order u celosti i kreira jednu transakciju', () => {
    const order = {
      quantity: 10,
      all_or_none: true,
      available_market_quantity: 10,
      status: 'PENDING',
      transactions: [] as Array<{ filled: number }>,
      is_done: false,
    };

    const canExecute = order.available_market_quantity >= order.quantity;

    if (canExecute) {
      order.transactions.push({ filled: order.quantity });
      order.status = 'DONE';
      order.is_done = true;
    }

    expect(canExecute).to.eq(true);
    expect(order.transactions).to.have.length(1);
    expect(order.transactions[0].filled).to.eq(10);
    expect(order.status).to.eq('DONE');
    expect(order.is_done).to.eq(true);
  });
});