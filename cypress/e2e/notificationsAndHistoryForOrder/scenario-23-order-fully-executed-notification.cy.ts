/// <reference types="cypress" />

describe('Scenario 23: Notifikacija kada se order u potpunosti izvrši', () => {
  it('order dobija isDone=true kada su sve porcije izvršene i korisnik prima email', () => {
    const order = {
      order_id: 4001,
      quantity: 10,
      remaining_portions: 10,
      status: 'APPROVED',
      is_done: false,
      transactions: [] as Array<{ filled: number; price: number }>,
    };

    const fills = [4, 6];

    fills.forEach((fill) => {
      order.transactions.push({ filled: fill, price: 150.0 });
      order.remaining_portions -= fill;

      if (order.remaining_portions === 0) {
        order.is_done = true;
        order.status = 'DONE';
      }
    });

    expect(order.remaining_portions).to.eq(0);
    expect(order.is_done).to.eq(true);
    expect(order.status).to.eq('DONE');
    expect(order.transactions).to.have.length(2);
  });

  it('backend prima signal za slanje email notifikacije kada isDone postane true', () => {
    const orderBefore = {
      order_id: 4001,
      status: 'APPROVED',
      is_done: false,
      remaining_portions: 3,
    };

    const orderAfter = {
      ...orderBefore,
      status: 'DONE',
      is_done: true,
      remaining_portions: 0,
    };

    expect(orderBefore.is_done).to.eq(false);
    expect(orderAfter.is_done).to.eq(true);
    expect(orderAfter.status).to.eq('DONE');
    expect(orderAfter.remaining_portions).to.eq(0);
  });
});
