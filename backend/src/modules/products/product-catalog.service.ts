import { AppError } from '../../shared/http/errors.js';
import { query } from '../../shared/persistence/db.js';

export type Product = {
  id: string;
  tenant_id: string;
  tenant_shop_id: string | null;
  source: 'fintab_export' | 'pancake_pos';
  source_product_code: string;
  product_name: string;
  product_type: string;
  unit: string | null;
  default_invoice_unit: string;
  allow_negative_stock: boolean;
  group_code: string | null;
  group_name: string | null;
  status: string;
  raw_json: Record<string, unknown>;
};

export type UpsertProductInput = {
  tenantId: string;
  shopId?: string | null;
  source: 'fintab_export' | 'pancake_pos';
  sourceProductCode: string;
  productName: string;
  productType?: string;
  unit?: string | null;
  defaultInvoiceUnit?: string;
  allowNegativeStock?: boolean;
  groupCode?: string | null;
  groupName?: string | null;
  warehouseCode?: string | null;
  businessCategory?: string | null;
  exciseTax?: string | null;
  status?: string;
  rawJson?: Record<string, unknown>;
};

export async function listProducts(tenantId: string, filters: { shopId?: string; shopIds?: string[]; search?: string; group?: string; status?: string; limit?: number } = {}): Promise<Product[]> {
  const conditions = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (filters.shopId) {
    params.push(filters.shopId);
    conditions.push(`(tenant_shop_id = $${params.length} OR (tenant_shop_id IS NULL AND source = 'fintab_export'))`);
  } else if (filters.shopIds) {
    params.push(filters.shopIds);
    conditions.push(`(tenant_shop_id = ANY($${params.length}::uuid[]) OR (tenant_shop_id IS NULL AND source = 'fintab_export'))`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.group) {
    params.push(filters.group);
    conditions.push(`group_code = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(source_product_code ILIKE $${params.length} OR product_name ILIKE $${params.length})`);
  }
  params.push(filters.limit ?? 100);
  return query<Product>(`SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${params.length}`, params);
}

export async function getProductById(tenantId: string, productId: string): Promise<Product> {
  const rows = await query<Product>('SELECT * FROM products WHERE tenant_id = $1 AND id = $2 LIMIT 1', [tenantId, productId]);
  const product = rows[0];
  if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
  return product;
}

export async function lookupProductByCode(tenantId: string, code: string, shopId?: string | null): Promise<Product | null> {
  if (shopId) {
    const rows = await query<Product>(
      `SELECT * FROM products
       WHERE tenant_id = $1 AND source_product_code = $2 AND (tenant_shop_id = $3 OR tenant_shop_id IS NULL)
       ORDER BY CASE WHEN tenant_shop_id = $3 THEN 0 ELSE 1 END, updated_at DESC
       LIMIT 1`,
      [tenantId, code, shopId]
    );
    return rows[0] ?? null;
  }
  const rows = await query<Product>(
    `SELECT * FROM products
     WHERE tenant_id = $1 AND source_product_code = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [tenantId, code]
  );
  return rows[0] ?? null;
}

export async function lookupProductByName(tenantId: string, name: string, shopId?: string | null): Promise<Product | null> {
  if (shopId) {
    const rows = await query<Product>(
      `SELECT * FROM products
       WHERE tenant_id = $1 AND lower(product_name) = lower($2) AND (tenant_shop_id = $3 OR tenant_shop_id IS NULL)
       ORDER BY CASE WHEN tenant_shop_id = $3 THEN 0 ELSE 1 END, updated_at DESC
       LIMIT 1`,
      [tenantId, name, shopId]
    );
    return rows[0] ?? null;
  }
  const rows = await query<Product>(
    `SELECT * FROM products
     WHERE tenant_id = $1 AND lower(product_name) = lower($2)
     ORDER BY updated_at DESC
     LIMIT 1`,
    [tenantId, name]
  );
  return rows[0] ?? null;
}

export async function upsertProduct(input: UpsertProductInput): Promise<Product> {
  const conflictTarget = input.shopId
    ? '(tenant_id, tenant_shop_id, source, source_product_code) WHERE tenant_shop_id IS NOT NULL'
    : '(tenant_id, source, source_product_code) WHERE tenant_shop_id IS NULL';
  const rows = await query<Product>(
    `INSERT INTO products(
       tenant_id, tenant_shop_id, source, source_product_code, product_name, product_type, unit, default_invoice_unit,
       allow_negative_stock, group_code, group_name, warehouse_code, business_category, excise_tax, status, raw_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT ${conflictTarget}
      DO UPDATE SET product_name = EXCLUDED.product_name,
                   product_type = EXCLUDED.product_type,
                   unit = EXCLUDED.unit,
                   default_invoice_unit = EXCLUDED.default_invoice_unit,
                   allow_negative_stock = EXCLUDED.allow_negative_stock,
                   group_code = EXCLUDED.group_code,
                   group_name = EXCLUDED.group_name,
                   warehouse_code = EXCLUDED.warehouse_code,
                   business_category = EXCLUDED.business_category,
                   excise_tax = EXCLUDED.excise_tax,
                   status = EXCLUDED.status,
                   raw_json = EXCLUDED.raw_json,
                   updated_at = now()
      RETURNING *`,
    [
      input.tenantId,
      input.shopId ?? null,
      input.source,
      input.sourceProductCode,
      input.productName,
      input.productType ?? 'goods',
      input.unit ?? null,
      input.defaultInvoiceUnit ?? defaultInvoiceUnit(input.unit),
      input.allowNegativeStock ?? false,
      input.groupCode ?? null,
      input.groupName ?? null,
      input.warehouseCode ?? null,
      input.businessCategory ?? null,
      input.exciseTax ?? null,
      input.status ?? 'active',
      input.rawJson ?? {}
    ]
  );
  return rows[0]!;
}

export function defaultInvoiceUnit(unit?: string | null): string {
  if (!unit || unit.trim() === '' || unit.trim() === 'ĐVT cơ bản') return 'cái';
  return unit.trim();
}

export function normalizeProductType(value?: string | null): string {
  if (value === 'Dịch vụ') return 'service';
  if (value === 'Combo') return 'combo';
  return 'goods';
}
