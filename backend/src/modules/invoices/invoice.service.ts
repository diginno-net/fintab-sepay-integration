import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { hasExistingInvoice } from '../pancake/pancake-status-policy.js';
import { getSepayConfigForShop } from '../sepay/sepay.service.js';
import { mapPancakeOrderToInvoicePreview, type InvoiceType } from './invoice-mapper.js';
import { validateInvoicePreview } from './invoice-validation.js';
import { getInvoiceBuyerRequestOrSuggested } from './invoice-buyer-request.service.js';

export async function createInvoicePreview(params: { tenantId: string; shopId: string; orderId: string; invoiceType: InvoiceType }) {
  const [pancakeClient, sepayConfig] = await Promise.all([
    pancakeClientForShop(params.tenantId, params.shopId),
    getSepayConfigForShop(params.tenantId, params.shopId)
  ]);
  const raw = await pancakeClient.getOrder(params.orderId);
  const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const orderRecord = (typeof wrapper.data === 'object' && wrapper.data !== null) ? wrapper.data as Record<string, unknown> : wrapper;
  const invoiceRequest = applySepayDefaults(
    await getInvoiceBuyerRequestOrSuggested(params.tenantId, params.shopId, params.orderId, orderRecord, sepayConfig),
    sepayConfig
  );
  const preview = await mapPancakeOrderToInvoicePreview({
    tenantId: params.tenantId,
    shopId: params.shopId,
    order: orderRecord,
    invoiceType: params.invoiceType,
    sepayConfig,
    invoiceRequest
  });
  validateInvoicePreview(preview);
  return {
    ...preview,
    sourceOrderSnapshot: orderRecord,
    hasExistingInvoice: hasExistingInvoice(orderRecord),
    invoiceRequest
  };
}

function applySepayDefaults<T extends { paymentMethod?: string | null; templateCode?: string | null; invoiceSeries?: string | null; taxRate?: number | null }>(
  request: T,
  sepayConfig: { default_payment_method: string | null; template_code: string | null; invoice_series: string | null; default_tax_rate: number | null }
): T {
  return {
    ...request,
    paymentMethod: request.paymentMethod ?? sepayConfig.default_payment_method,
    templateCode: request.templateCode ?? sepayConfig.template_code,
    invoiceSeries: request.invoiceSeries ?? sepayConfig.invoice_series,
    taxRate: request.taxRate ?? sepayConfig.default_tax_rate
  };
}
