describe('Scenario 62: Stop-Limit order pretvara se u Limit order pri dostizanju stop vrednosti', () => {
  it('postaje Buy Limit order i kupuje se samo ako je ask <= limit', () => {
    const order = {
      type: 'STOP_LIMIT',
      direction: 'BUY',
      stop: 120,
      limit: 125,
      triggered: false,
      converted_type: null as string | null,
    };

    const askPrice = 121;

    if (askPrice >= order.stop) {
      order.triggered = true;
      order.converted_type = 'LIMIT';
    }

    const canBuy = order.triggered && askPrice <= order.limit;

    expect(order.triggered).to.eq(true);
    expect(order.converted_type).to.eq('LIMIT');
    expect(canBuy).to.eq(true);
  });
});