import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { hasExistingInvoice } from '../pancake/pancake-status-policy.js';
import { getSepayConfigForShop } from '../sepay/sepay.service.js';
import { mapPancakeOrderToInvoicePreview, type InvoiceType } from './invoice-mapper.js';
import { validateInvoicePreview } from './invoice-validation.js';

export async function createInvoicePreview(params: { tenantId: string; shopId: string; orderId: string; invoiceType: InvoiceType }) {
  const [pancakeClient, sepayConfig] = await Promise.all([
    pancakeClientForShop(params.tenantId, params.shopId),
    getSepayConfigForShop(params.tenantId, params.shopId)
  ]);
  const raw = await pancakeClient.getOrder(params.orderId);
  const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const orderRecord = (typeof wrapper.data === 'object' && wrapper.data !== null) ? wrapper.data as Record<string, unknown> : wrapper;
  const preview = await mapPancakeOrderToInvoicePreview({
    tenantId: params.tenantId,
    shopId: params.shopId,
    order: orderRecord,
    invoiceType: params.invoiceType,
    sepayConfig
  });
  validateInvoicePreview(preview);
  return {
    ...preview,
    sourceOrderSnapshot: orderRecord,
    hasExistingInvoice: hasExistingInvoice(orderRecord)
  };
}
