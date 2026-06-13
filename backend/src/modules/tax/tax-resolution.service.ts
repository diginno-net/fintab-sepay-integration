import { query } from '../../shared/persistence/db.js';
import { lookupProductByCode, lookupProductByName, type Product } from '../products/product-catalog.service.js';
import { assertShopBelongsToTenant } from '../tenant/tenant-shop.service.js';

export type OrderItemLike = {
  product_id?: string | number | null;
  barcode?: string | null;
  variation_id?: string | number | null;
  product_code?: string | null;
  name?: string | null;
  product_name?: string | null;
  variation_info?: {
    display_id?: string | null;
    product_display_id?: string | null;
    barcode?: string | null;
    name?: string | null;
    product_name?: string | null;
    retail_price?: string | number | null;
    tax_rate?: string | number | null;
    measure_info?: { name?: string | null };
  } | null;
};

export type TaxResolution = {
  product: Product | null;
  taxRate: number | null;
  invoiceLineType: number;
  invoiceUnit: string;
  source: 'product_profile' | 'tenant_profile' | 'variation_info' | 'shop_default' | 'missing';
  warnings: string[];
  shouldBlock: boolean;
};

type TaxProfileRow = {
  tax_rate: number;
  invoice_line_type: number;
  invoice_unit: string | null;
};

type ShopDefaultRow = {
  default_tax_rate: number;
  default_invoice_unit: string;
  unknown_product_policy: 'warn' | 'block' | 'use_default';
};

export async function resolveTaxForOrderItem(tenantId: string, shopId: string, item: OrderItemLike): Promise<TaxResolution> {
  await assertShopBelongsToTenant(tenantId, shopId);
  const vi = item.variation_info ?? {};
  const code = firstString(
    vi?.display_id,
    vi?.product_display_id,
    vi?.barcode,
    item.barcode,
    item.product_code,
    item.variation_id,
    item.product_id
  );
  const name = firstString(vi?.name, item.name, item.product_name);
  const product = code ? await lookupProductByCode(tenantId, code, shopId) : name ? await lookupProductByName(tenantId, name, shopId) : null;
  const sourceProductCode = product?.source_product_code ?? code;

  if (sourceProductCode) {
    const shopProfile = await findTaxProfile(tenantId, shopId, sourceProductCode);
    if (shopProfile) return profileResolution(product, shopProfile, 'product_profile');

    const tenantProfile = await findTaxProfile(tenantId, null, sourceProductCode);
    if (tenantProfile) return profileResolution(product, tenantProfile, 'tenant_profile');
  }

  const defaults = await getShopDefaults(tenantId, shopId);
  if (defaults) {
    const warnings = [product ? 'Product tax profile missing; using shop default tax' : 'Product not matched; using shop default tax'];
    if (defaults.unknown_product_policy === 'use_default') {
      return {
        product,
        taxRate: defaults.default_tax_rate,
        invoiceLineType: 1,
        invoiceUnit: defaults.default_invoice_unit,
        source: 'shop_default',
        warnings,
        shouldBlock: false
      };
    }
  }

  const variationTaxRate = num(vi?.tax_rate);
  if (variationTaxRate !== null) {
    return {
      product,
      taxRate: variationTaxRate,
      invoiceLineType: 1,
      invoiceUnit: product?.default_invoice_unit ?? firstString(vi?.measure_info?.name) ?? 'cái',
      source: 'variation_info',
      warnings: product ? ['Product tax profile missing; using Pancake variation tax rate'] : ['Product not matched; using Pancake variation tax rate'],
      shouldBlock: false
    };
  }

  if (defaults) {
    const warnings = [product ? 'Product tax profile missing; using shop default tax' : 'Product not matched; using shop default tax'];
    return {
      product,
      taxRate: defaults.default_tax_rate,
      invoiceLineType: 1,
      invoiceUnit: defaults.default_invoice_unit,
      source: 'shop_default',
      warnings,
      shouldBlock: defaults.unknown_product_policy === 'block'
    };
  }

  return {
    product,
    taxRate: null,
    invoiceLineType: 1,
    invoiceUnit: product?.default_invoice_unit ?? 'cái',
    source: 'missing',
    warnings: ['Missing tax profile and shop tax defaults'],
    shouldBlock: true
  };
}

async function findTaxProfile(tenantId: string, shopId: string | null, sourceProductCode: string): Promise<TaxProfileRow | null> {
  const rows = await query<TaxProfileRow>(
    `SELECT tax_rate, invoice_line_type, invoice_unit
     FROM product_tax_profiles
     WHERE tenant_id = $1 AND tenant_shop_id IS NOT DISTINCT FROM $2 AND source_product_code = $3
     LIMIT 1`,
    [tenantId, shopId, sourceProductCode]
  );
  return rows[0] ?? null;
}

async function getShopDefaults(tenantId: string, shopId: string): Promise<ShopDefaultRow | null> {
  const rows = await query<ShopDefaultRow>('SELECT default_tax_rate, default_invoice_unit, unknown_product_policy FROM shop_tax_defaults WHERE tenant_id = $1 AND tenant_shop_id = $2 LIMIT 1', [tenantId, shopId]);
  return rows[0] ?? null;
}

function profileResolution(product: Product | null, profile: TaxProfileRow, source: 'product_profile' | 'tenant_profile'): TaxResolution {
  return {
    product,
    taxRate: profile.tax_rate,
    invoiceLineType: profile.invoice_line_type,
    invoiceUnit: profile.invoice_unit ?? product?.default_invoice_unit ?? 'cái',
    source,
    warnings: [],
    shouldBlock: false
  };
}

function firstString(...values: Array<string | number | null | undefined>): string | null {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
