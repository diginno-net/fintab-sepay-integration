import { describe, expect, it } from 'vitest';
import { getPancakePaymentStatus, assertPancakeOrderPaid } from './pancake-payment-policy.js';

describe('pancake payment policy', () => {
  it('treats money_to_collect = 0 as paid', () => {
    expect(getPancakePaymentStatus({ money_to_collect: 0 }).status).toBe('paid');
  });

  it('treats positive money_to_collect as unpaid', () => {
    expect(getPancakePaymentStatus({ money_to_collect: 50000 }).status).toBe('unpaid');
  });

  it('treats COD without collection confirmation as unknown', () => {
    expect(getPancakePaymentStatus({ cod: 100000 }).status).toBe('unknown');
  });

  it('blocks unpaid orders', () => {
    expect(() => assertPancakeOrderPaid({ money_to_collect: 1 }, 'create_draft')).toThrow('Chỉ được tạo/phát hành hóa đơn');
  });

  it('allows completed status as paid by shop policy', () => {
    const policy = { mode: 'completed_status_as_paid' as const, completedStatuses: [3, 'delivered'] };

    expect(getPancakePaymentStatus({ status: 'delivered', money_to_collect: 183000 }, policy).status).toBe('paid_by_policy');
    expect(() => assertPancakeOrderPaid({ status: 'delivered', money_to_collect: 183000 }, 'create_draft', policy)).not.toThrow();
  });

  it('keeps strict mode blocking delivered but unpaid orders', () => {
    expect(getPancakePaymentStatus({ status: 'delivered', money_to_collect: 183000 }, { mode: 'strict', completedStatuses: ['delivered'] }).status).toBe('unpaid');
  });
});
