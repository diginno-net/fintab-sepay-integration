import { AppError } from '../../shared/http/errors.js';
import { assertPancakeOrderPaid } from '../pancake/pancake-payment-policy.js';
import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { getShopPaymentPolicy } from '../tenant/tenant-shop.service.js';
import { assertCompanyPayloadMatchesRequest, assertInvoiceRequestReadyForDraft } from './invoice-request-rules.js';
import { createInvoicePreview } from './invoice.service.js';
import { createOrReuseDraftJob, enqueueIssueJob, findInvoiceJobByOrder } from './invoice-job.service.js';
import type { InvoiceType } from './invoice-mapper.js';

export async function createDraftForOrder(input: {
  tenantId: string;
  shopId: string;
  orderId: string;
  actorUserId?: string | null;
  invoiceType?: InvoiceType;
}) {
  const invoiceType = input.invoiceType ?? 'ban_hang';
  const preview = await createInvoicePreview({ tenantId: input.tenantId, shopId: input.shopId, orderId: input.orderId, invoiceType });
  const paymentPolicy = await getShopPaymentPolicy(input.tenantId, input.shopId);
  assertPancakeOrderPaid(preview.sourceOrderSnapshot, 'create_draft', paymentPolicy);
  assertInvoiceRequestReadyForDraft(preview.invoiceRequest);
  assertCompanyPayloadMatchesRequest(preview.invoiceRequest, preview.payload);
  return createOrReuseDraftJob({
    tenantId: input.tenantId,
    shopId: input.shopId,
    actorUserId: input.actorUserId ?? null,
    sourceOrderId: input.orderId,
    invoiceType,
    sourceOrderSnapshot: preview.sourceOrderSnapshot,
    requestPayload: preview.payload,
    warnings: preview.warnings,
    invoiceBuyerRequestSnapshot: {
      buyerType: preview.invoiceRequest.buyerType,
      contactName: preview.invoiceRequest.contactName,
      buyerEmail: preview.invoiceRequest.buyerEmail,
      buyerPhone: preview.invoiceRequest.buyerPhone,
      invoiceAddress: preview.invoiceRequest.invoiceAddress,
      taxCode: preview.invoiceRequest.taxCode,
      legalName: preview.invoiceRequest.legalName,
      buyerUnitName: preview.invoiceRequest.buyerUnitName,
      identityNumber: preview.invoiceRequest.identityNumber
    }
  });
}

export async function issueOrderInvoice(input: { tenantId: string; shopId: string; orderId: string; actorUserId: string }) {
  const job = await findInvoiceJobByOrder(input.tenantId, input.shopId, input.orderId);
  if (!job) throw new AppError('NOT_FOUND', 'Chưa có bản nháp hóa đơn cho đơn hàng này.', 404);
  const client = await pancakeClientForShop(input.tenantId, input.shopId);
  const raw = await client.getOrder(input.orderId);
  const wrapper = typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {};
  const orderRecord = (typeof wrapper.data === 'object' && wrapper.data !== null) ? wrapper.data as Record<string, unknown> : wrapper;
  const paymentPolicy = await getShopPaymentPolicy(input.tenantId, input.shopId);
  assertPancakeOrderPaid(orderRecord, 'issue', paymentPolicy);
  return enqueueIssueJob({ tenantId: input.tenantId, invoiceJobId: job.id, actorUserId: input.actorUserId });
}

export async function bulkCreateDraftForOrders(input: { tenantId: string; shopId: string; orderIds: string[]; actorUserId?: string | null; invoiceType?: InvoiceType }) {
  const results = [];
  for (const orderId of input.orderIds.slice(0, 500)) {
    try {
      const result = await createDraftForOrder({ ...input, orderId });
      results.push({ orderId, ok: true, invoiceJobId: result.invoiceJob.id, backgroundJobId: result.backgroundJobId, reused: result.reused });
    } catch (error) {
      results.push({ orderId, ok: false, message: error instanceof Error ? error.message : 'Không tạo được nháp.' });
    }
  }
  return { results };
}

export async function bulkIssueOrders(input: { tenantId: string; shopId: string; orderIds: string[]; actorUserId: string }) {
  const results = [];
  for (const orderId of input.orderIds.slice(0, 100)) {
    try {
      const result = await issueOrderInvoice({ ...input, orderId });
      results.push({ orderId, ok: true, invoiceJobId: result.invoiceJob.id, backgroundJobId: result.backgroundJobId });
    } catch (error) {
      results.push({ orderId, ok: false, message: error instanceof Error ? error.message : 'Không phát hành được.' });
    }
  }
  return { results };
}
