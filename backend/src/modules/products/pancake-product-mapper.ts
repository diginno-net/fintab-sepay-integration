import { defaultInvoiceUnit } from './product-catalog.service.js';

export type PancakeVariation = {
  id?: string | number | null;
  product_id?: string | number | null;
  variation_id?: string | number | null;
  display_id?: string | number | null;
  product_display_id?: string | number | null;
  barcode?: string | number | null;
  name?: string | number | null;
  product_name?: string | number | null;
  retail_price?: string | number | null;
  wholesale_price?: string | number | null;
  wholesale_price2?: string | number | null;
  weight?: string | number | null;
  measure_info?: {
    name?: string | number | null;
  } | null;
  category_ids?: Array<string | number> | null;
  brand_id?: string | number | null;
  is_upsale_product?: boolean | null;
  detail?: string | number | null;
  images?: Array<unknown> | null;
  product?: {
    display_id?: string | number | null;
    name?: string | number | null;
    categories?: Array<unknown> | null;
    note_product?: string | number | null;
  } | null;
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

export type MappedProduct = {
  source: 'pancake_pos';
  sourceProductCode: string;
  productName: string;
  productType: string;
  unit: string | null;
  defaultInvoiceUnit: string;
  groupCode: string | null;
  groupName: string | null;
  status: string;
  rawJson: Record<string, unknown>;
};

export function mapPancakeVariationToProduct(
  variation: PancakeVariation,
  tenantId: string
): MappedProduct | null {
  const nestedProduct = variation.product ?? null;
  const nestedProductObj = typeof nestedProduct === 'object' && nestedProduct !== null
    ? nestedProduct as Record<string, unknown>
    : {};

  const variationDisplayId = str(variation.display_id);
  const barcode = str(variation.barcode);
  const variationId = str(variation.variation_id);
  const productId = str(variation.product_id);
  const id = str(variation.id);

  const code = variationDisplayId
    ?? str(variation.product_display_id)
    ?? str(nestedProductObj.display_id)
    ?? barcode
    ?? variationId
    ?? productId
    ?? id;

  if (!code) return null;

  const name = str(
    variation.name
    ?? variation.product_name
    ?? nestedProductObj.name
  );
  if (!name) return null;

  const unit = str(variation.measure_info?.name);
  const categoryIds = Array.isArray(variation.category_ids) ? variation.category_ids : null;

  return {
    source: 'pancake_pos',
    sourceProductCode: code,
    productName: name,
    productType: 'goods',
    unit,
    defaultInvoiceUnit: defaultInvoiceUnit(unit),
    groupCode: categoryIds && categoryIds.length > 0 ? String(categoryIds[0]) : null,
    groupName: null,
    status: 'active',
    rawJson: { variation, synced_tenant_id: tenantId }
  };
}
