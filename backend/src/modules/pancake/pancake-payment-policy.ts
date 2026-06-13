import { AppError } from '../../shared/http/errors.js';

export type PancakePaymentStatus = 'paid' | 'paid_by_policy' | 'unpaid' | 'unknown';

export type PancakePaymentPolicyConfig = {
  mode?: 'strict' | 'hybrid' | 'completed_status_as_paid';
  completedStatuses?: Array<string | number>;
};

type PancakePaymentDecision = {
  status: PancakePaymentStatus;
  reason: string;
};

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getPancakePaymentStatus(order: Record<string, unknown>, policy: PancakePaymentPolicyConfig = {}): PancakePaymentDecision {
  if (policy.mode === 'completed_status_as_paid' && matchesCompletedStatus(order, policy)) {
    return { status: 'paid_by_policy', reason: 'Order status is eligible by shop payment policy' };
  }

  const explicitStatus = str(order.payment_status ?? order.paymentStatus ?? order.payment_state ?? order.paymentState)?.toLowerCase();
  if (explicitStatus) {
    if (['paid', 'paid_done', 'success', 'successful', 'completed', 'complete', 'da_thanh_toan', 'đã thanh toán'].includes(explicitStatus)) {
      return { status: 'paid', reason: 'Pancake payment_status indicates paid' };
    }
    if (['unpaid', 'pending', 'failed', 'cancelled', 'canceled', 'not_paid', 'chua_thanh_toan', 'chưa thanh toán'].includes(explicitStatus)) {
      return { status: 'unpaid', reason: 'Pancake payment_status indicates unpaid' };
    }
  }

  const moneyToCollect = num(order.money_to_collect ?? order.moneyToCollect);
  if (moneyToCollect !== null) {
    if (moneyToCollect <= 0) return { status: 'paid', reason: 'money_to_collect is zero' };
    if (policy.mode === 'hybrid' && matchesCompletedStatus(order, policy)) {
      return { status: 'paid_by_policy', reason: 'money_to_collect is greater than zero but order status is eligible by shop payment policy' };
    }
    return { status: 'unpaid', reason: 'money_to_collect is greater than zero' };
  }

  const cod = num(order.cod);
  if (cod !== null && cod > 0) {
    if (policy.mode === 'hybrid' && matchesCompletedStatus(order, policy)) {
      return { status: 'paid_by_policy', reason: 'COD order status is eligible by shop payment policy' };
    }
    return { status: 'unknown', reason: 'COD order has no money_to_collect confirmation' };
  }

  if (policy.mode === 'hybrid' && matchesCompletedStatus(order, policy)) {
    return { status: 'paid_by_policy', reason: 'Order status is eligible by shop payment policy' };
  }

  return { status: 'unknown', reason: 'No reliable Pancake payment signal found' };
}

export function assertPancakeOrderPaid(order: Record<string, unknown>, action: 'create_draft' | 'issue' | 'webhook_auto_draft', policy: PancakePaymentPolicyConfig = {}): PancakePaymentDecision {
  const decision = getPancakePaymentStatus(order, policy);
  if (decision.status !== 'paid' && decision.status !== 'paid_by_policy') {
    throw new AppError('VALIDATION_ERROR', 'Chỉ được tạo/phát hành hóa đơn cho đơn Pancake đã thanh toán.', 400, {
      code: 'PANCAKE_ORDER_NOT_PAID',
      action,
      paymentStatus: decision.status,
      reason: decision.reason
    });
  }
  return decision;
}

function matchesCompletedStatus(order: Record<string, unknown>, policy: PancakePaymentPolicyConfig): boolean {
  const statuses = policy.completedStatuses ?? [];
  if (statuses.length === 0) return false;
  const candidates = [order.status, order.status_id, order.statusName, order.status_name, order.sub_status, order.fulfillment_status]
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map(value => normalizeStatus(value))
    .filter((value): value is string => Boolean(value));
  const allowed = new Set(statuses.map(normalizeStatus));
  return candidates.some(candidate => allowed.has(candidate));
}

function normalizeStatus(value: string | number): string {
  return String(value).trim().toLowerCase();
}
