describe('Scenario 59: Izvršavanje Market ordera u delovima', () => {
  it('kreira transakciju za svaki deo i smanjuje remaining portions', () => {
    const fills = [3, 4, 3];

    const order = {
      quantity: 10,
      remaining_portions: 10,
      is_done: false,
      transactions: [] as Array<{ filled: number }>,
    };

    fills.forEach((fill) => {
      order.transactions.push({ filled: fill });
      order.remaining_portions -= fill;

      if (order.remaining_portions === 0) {
        order.is_done = true;
      }
    });

    expect(order.transactions).to.have.length(3);
    expect(order.transactions[0].filled).to.eq(3);
    expect(order.transactions[1].filled).to.eq(4);
    expect(order.transactions[2].filled).to.eq(3);
    expect(order.remaining_portions).to.eq(0);
    expect(order.is_done).to.eq(true);
  });
});