import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';
import { getProductById } from '../products/product-catalog.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';

export const allowedTaxRates = [-2, -1, 0, 5, 8, 10] as const;
export type TaxRate = (typeof allowedTaxRates)[number];
export type UnknownProductPolicy = 'warn' | 'block' | 'use_default';

export type ProductTaxProfileInput = {
  tenantShopId?: string | null;
  taxRate: TaxRate;
  taxCategory: 'taxable' | 'non_taxable' | 'non_declarable' | 'zero_rated';
  invoiceLineType?: 1 | 2 | 3 | 4;
  invoiceUnit?: string | null;
  isTaxInclusivePrice?: boolean;
};

export async function getProductTaxProfile(tenantId: string, productId: string) {
  await getProductById(tenantId, productId);
  const rows = await query(
    `SELECT * FROM product_tax_profiles
     WHERE tenant_id = $1 AND product_id = $2
     ORDER BY tenant_shop_id NULLS LAST, updated_at DESC
     LIMIT 1`,
    [tenantId, productId]
  );
  return rows[0] ?? null;
}

export async function upsertProductTaxProfile(tenantId: string, productId: string, input: ProductTaxProfileInput) {
  const product = await getProductById(tenantId, productId);
  if (input.tenantShopId) await assertShopBelongsToTenant(tenantId, input.tenantShopId);
  const rows = await query(
    `INSERT INTO product_tax_profiles(
       tenant_id, tenant_shop_id, product_id, source_product_code, product_name_snapshot,
       tax_rate, tax_category, invoice_line_type, invoice_unit, is_tax_inclusive_price
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tenant_id, tenant_shop_id, source_product_code)
     DO UPDATE SET product_id = EXCLUDED.product_id,
                   product_name_snapshot = EXCLUDED.product_name_snapshot,
                   tax_rate = EXCLUDED.tax_rate,
                   tax_category = EXCLUDED.tax_category,
                   invoice_line_type = EXCLUDED.invoice_line_type,
                   invoice_unit = EXCLUDED.invoice_unit,
                   is_tax_inclusive_price = EXCLUDED.is_tax_inclusive_price,
                   updated_at = now()
     RETURNING *`,
    [
      tenantId,
      input.tenantShopId ?? null,
      productId,
      product.source_product_code,
      product.product_name,
      input.taxRate,
      input.taxCategory,
      input.invoiceLineType ?? 1,
      input.invoiceUnit ?? product.default_invoice_unit,
      input.isTaxInclusivePrice ?? true
    ]
  );
  return rows[0];
}

export async function getShopTaxDefaults(tenantId: string, shopId: string) {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query('SELECT * FROM shop_tax_defaults WHERE tenant_id = $1 AND tenant_shop_id = $2 LIMIT 1', [tenantId, shopId]);
  return rows[0] ?? null;
}

export async function upsertShopTaxDefaults(
  tenantId: string,
  shopId: string,
  input: { defaultTaxRate: TaxRate; defaultInvoiceUnit?: string; defaultInvoiceType?: 'gtgt' | 'ban_hang'; unknownProductPolicy?: UnknownProductPolicy }
) {
  await assertShopBelongsToTenant(tenantId, shopId);
  const rows = await query(
    `INSERT INTO shop_tax_defaults(tenant_id, tenant_shop_id, default_tax_rate, default_invoice_unit, default_invoice_type, unknown_product_policy)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (tenant_id, tenant_shop_id)
     DO UPDATE SET default_tax_rate = EXCLUDED.default_tax_rate,
                   default_invoice_unit = EXCLUDED.default_invoice_unit,
                   default_invoice_type = EXCLUDED.default_invoice_type,
                   unknown_product_policy = EXCLUDED.unknown_product_policy,
                   updated_at = now()
     RETURNING *`,
    [tenantId, shopId, input.defaultTaxRate, input.defaultInvoiceUnit ?? 'cái', input.defaultInvoiceType ?? 'ban_hang', input.unknownProductPolicy ?? 'warn']
  );
  return rows[0];
}

export function assertValidTaxRate(value: number): asserts value is TaxRate {
  if (!allowedTaxRates.includes(value as TaxRate)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid tax rate', 400, { allowed: allowedTaxRates });
  }
}
