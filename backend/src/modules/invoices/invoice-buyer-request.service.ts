import { query } from '../../shared/persistence/db.js';
import type { SepayShopConfig } from '../sepay/sepay.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';
import type { InvoiceBuyerRequest, InvoiceBuyerRequestInput, InvoiceBuyerRequestResponse } from './invoice-buyer-request.schema.js';
import { normalizeInvoiceRequestForProcessing } from './invoice-request-normalizers.js';
import { buildSuggestedInvoiceRequestFromPancakeOrder } from './invoice-request-suggestions.js';

export async function getInvoiceBuyerRequest(
  tenantId: string,
  shopId: string,
  orderId: string
): Promise<InvoiceBuyerRequest | null> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query<InvoiceBuyerRequest>(
    `SELECT id,
            tenant_id AS "tenantId",
            tenant_shop_id AS "tenantShopId",
            source_order_id AS "sourceOrderId",
            buyer_type AS "buyerType",
            contact_name AS "contactName",
            buyer_unit_name AS "buyerUnitName",
            legal_name AS "legalName",
            tax_code AS "taxCode",
            identity_number AS "identityNumber",
            invoice_address AS "invoiceAddress",
            buyer_email AS "buyerEmail",
            buyer_phone AS "buyerPhone",
            payment_method AS "paymentMethod",
            template_code AS "templateCode",
            invoice_series AS "invoiceSeries",
            tax_rate AS "taxRate",
            notes,
            confirmed,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM invoice_buyer_requests
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND source_order_id = $3
     LIMIT 1`,
    [tenantId, shopId, orderId]
  );
  return rows[0] ?? null;
}

export async function listInvoiceBuyerRequestsByOrders(
  tenantId: string,
  shopId: string,
  orderIds: string[]
): Promise<InvoiceBuyerRequest[]> {
  await assertShopBelongsToTenant(tenantId, shopId);
  if (orderIds.length === 0) return [];
  return query<InvoiceBuyerRequest>(
    `SELECT id,
            tenant_id AS "tenantId",
            tenant_shop_id AS "tenantShopId",
            source_order_id AS "sourceOrderId",
            buyer_type AS "buyerType",
            contact_name AS "contactName",
            buyer_unit_name AS "buyerUnitName",
            legal_name AS "legalName",
            tax_code AS "taxCode",
            identity_number AS "identityNumber",
            invoice_address AS "invoiceAddress",
            buyer_email AS "buyerEmail",
            buyer_phone AS "buyerPhone",
            payment_method AS "paymentMethod",
            template_code AS "templateCode",
            invoice_series AS "invoiceSeries",
            tax_rate AS "taxRate",
            notes,
            confirmed,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM invoice_buyer_requests
     WHERE tenant_id = $1 AND tenant_shop_id = $2 AND source_order_id = ANY($3::text[])`,
    [tenantId, shopId, orderIds]
  );
}

export async function getInvoiceBuyerRequestOrSuggested(
  tenantId: string,
  shopId: string,
  orderId: string,
  order: Record<string, unknown> | null,
  sepayConfig?: SepayShopConfig
): Promise<InvoiceBuyerRequestResponse> {
  const saved = await getInvoiceBuyerRequest(tenantId, shopId, orderId);
  if (saved) return { ...saved, source: 'saved' };
  return buildSuggestedInvoiceRequestFromPancakeOrder(order ?? {}, sepayConfig);
}

export async function upsertInvoiceBuyerRequest(
  tenantId: string,
  shopId: string,
  orderId: string,
  input: InvoiceBuyerRequestInput
): Promise<InvoiceBuyerRequest> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const normalized = normalizeInvoiceRequestForProcessing(input);
  const rows = await query<InvoiceBuyerRequest>(
    `INSERT INTO invoice_buyer_requests(
       tenant_id, tenant_shop_id, source_order_id, buyer_type, contact_name,
       buyer_unit_name, legal_name, tax_code, identity_number, invoice_address,
       buyer_email, buyer_phone, payment_method, template_code, invoice_series,
       tax_rate, notes, confirmed, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now())
     ON CONFLICT (tenant_id, tenant_shop_id, source_order_id)
     DO UPDATE SET
       buyer_type = EXCLUDED.buyer_type,
       contact_name = EXCLUDED.contact_name,
       buyer_unit_name = EXCLUDED.buyer_unit_name,
       legal_name = EXCLUDED.legal_name,
       tax_code = EXCLUDED.tax_code,
       identity_number = EXCLUDED.identity_number,
       invoice_address = EXCLUDED.invoice_address,
       buyer_email = EXCLUDED.buyer_email,
       buyer_phone = EXCLUDED.buyer_phone,
       payment_method = EXCLUDED.payment_method,
       template_code = EXCLUDED.template_code,
       invoice_series = EXCLUDED.invoice_series,
       tax_rate = EXCLUDED.tax_rate,
       notes = EXCLUDED.notes,
       confirmed = EXCLUDED.confirmed,
       updated_at = now()
      RETURNING id,
                tenant_id AS "tenantId",
                tenant_shop_id AS "tenantShopId",
                source_order_id AS "sourceOrderId",
                buyer_type AS "buyerType",
                contact_name AS "contactName",
                buyer_unit_name AS "buyerUnitName",
                legal_name AS "legalName",
                tax_code AS "taxCode",
                identity_number AS "identityNumber",
                invoice_address AS "invoiceAddress",
                buyer_email AS "buyerEmail",
                buyer_phone AS "buyerPhone",
                payment_method AS "paymentMethod",
                template_code AS "templateCode",
                invoice_series AS "invoiceSeries",
                tax_rate AS "taxRate",
                notes,
                confirmed,
                created_at AS "createdAt",
                updated_at AS "updatedAt"`,
    [
      tenantId,
      shopId,
      orderId,
      normalized.buyerType,
      normalized.contactName,
      normalized.buyerUnitName,
      normalized.legalName,
      normalized.taxCode,
      normalized.identityNumber,
      normalized.invoiceAddress,
      normalized.buyerEmail,
      normalized.buyerPhone,
      normalized.paymentMethod,
      normalized.templateCode,
      normalized.invoiceSeries,
      normalized.taxRate,
      normalized.notes,
      normalized.confirmed
    ]
  );
  return rows[0]!;
}
