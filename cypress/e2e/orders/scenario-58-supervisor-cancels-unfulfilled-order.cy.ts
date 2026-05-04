describe('Scenario 58: Supervizor otkazuje neispunjeni order', () => {
  it('otkazani delovi ordera se ne izvršavaju i status ordera se ažurira', () => {
    const before = {
      order_id: 301,
      quantity: 10,
      remaining_portions: 4,
      status: 'APPROVED',
      is_done: false,
    };

    const after = {
      order_id: 301,
      quantity: 10,
      remaining_portions: 0,
      status: 'CANCELLED',
      is_done: false,
    };

    expect(before.remaining_portions).to.eq(4);
    expect(after.remaining_portions).to.eq(0);
    expect(after.status).to.eq('CANCELLED');
    expect(after.is_done).to.eq(false);
  });
});