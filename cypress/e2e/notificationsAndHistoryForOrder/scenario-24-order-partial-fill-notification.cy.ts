/// <reference types="cypress" />

describe('Scenario 24: Notifikacija kada se order delimično izvrši', () => {
  it('notifikacija sadrži broj izvršenih i preostalih akcija pri partial fill-u', () => {
    const order = {
      order_id: 5001,
      quantity: 10,
      remaining_portions: 10,
      status: 'APPROVED',
      is_done: false,
    };

    const filledNow = 4;
    order.remaining_portions -= filledNow;

    const notification = {
      order_id: order.order_id,
      type: 'PARTIAL_FILL',
      filled: filledNow,
      remaining: order.remaining_portions,
      total: order.quantity,
    };

    expect(notification.filled).to.eq(4);
    expect(notification.remaining).to.eq(6);
    expect(notification.total).to.eq(10);
    expect(notification.type).to.eq('PARTIAL_FILL');

    expect(order.is_done).to.eq(false);
    expect(order.remaining_portions).to.be.greaterThan(0);
  });

  it('notifikacija opisuje šta je izvršeno a šta preostaje', () => {
    const totalQuantity = 10;
    const filledPortions = 4;
    const remainingPortions = totalQuantity - filledPortions;

    const notificationMessage = `Izvršeno ${filledPortions} od ${totalQuantity} akcija. Preostaje: ${remainingPortions}.`;

    expect(notificationMessage).to.include('Izvršeno 4');
    expect(notificationMessage).to.include('od 10 akcija');
    expect(notificationMessage).to.include('Preostaje: 6');
  });

  it('order nije isDone nakon partial fill', () => {
    const order = {
      order_id: 5001,
      quantity: 10,
      remaining_portions: 10,
      is_done: false,
      status: 'APPROVED',
    };

    order.remaining_portions -= 4;
    if (order.remaining_portions === 0) {
      order.is_done = true;
      order.status = 'DONE';
    } else {
      order.status = 'PARTIALLY_FILLED';
    }

    expect(order.is_done).to.eq(false);
    expect(order.status).to.eq('PARTIALLY_FILLED');
    expect(order.remaining_portions).to.eq(6);
  });
});
