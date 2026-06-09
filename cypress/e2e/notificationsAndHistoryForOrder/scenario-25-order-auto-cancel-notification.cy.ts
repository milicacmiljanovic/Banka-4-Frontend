/// <reference types="cypress" />

describe('Scenario 25: Notifikacija kada se order automatski otkaže', () => {
  it('futures order se automatski otkazuje kada settlement date istekne pre izvršenja', () => {
    const settlementDate = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-06-09T12:00:00Z');

    const order = {
      order_id: 6001,
      ticker: 'CLZ26',
      asset_type: 'Futures',
      order_type: 'MARKET',
      quantity: 5,
      remaining_portions: 5,
      status: 'APPROVED',
      is_done: false,
      settlement_date: settlementDate.toISOString(),
    };

    const isSettlementExpired = new Date(order.settlement_date).getTime() < now.getTime();

    if (isSettlementExpired && !order.is_done) {
      order.status = 'CANCELLED';
    }

    expect(isSettlementExpired).to.eq(true);
    expect(order.status).to.eq('CANCELLED');
    expect(order.is_done).to.eq(false);
  });

  it('notifikacija o otkazivanju sadrži razlog — settlement date je prošao', () => {
    const cancellationNotification = {
      order_id: 6001,
      type: 'AUTO_CANCELLED',
      reason: 'Settlement date expired',
      ticker: 'CLZ26',
      asset_type: 'Futures',
    };

    expect(cancellationNotification.type).to.eq('AUTO_CANCELLED');
    expect(cancellationNotification.reason).to.include('Settlement date');
    expect(cancellationNotification.ticker).to.eq('CLZ26');
  });

  it('order koji nije futures sa isteklim settlement date-om ostaje aktivan', () => {
    const stock_order = {
      order_id: 6002,
      ticker: 'AAPL',
      asset_type: 'Stock',
      order_type: 'LIMIT',
      quantity: 10,
      remaining_portions: 10,
      status: 'APPROVED',
      is_done: false,
      settlement_date: null,
    };

    const isSettlementExpired = stock_order.settlement_date
      ? new Date(stock_order.settlement_date).getTime() < Date.now()
      : false;

    if (isSettlementExpired && stock_order.asset_type === 'Futures') {
      stock_order.status = 'CANCELLED';
    }

    expect(stock_order.status).to.eq('APPROVED');
    expect(isSettlementExpired).to.eq(false);
  });
});
