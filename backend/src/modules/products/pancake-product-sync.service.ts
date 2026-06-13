import { pancakeClientForShop } from '../pancake/pancake.service.js';
import { upsertProduct } from './product-catalog.service.js';
import { mapPancakeVariationToProduct, type PancakeVariation } from './pancake-product-mapper.js';

export type ProductSyncResult = {
  synced: number;
  skipped: number;
  failed: number;
  totalEntries: number;
  totalPages: number;
  errors: Array<{ code: string; message: string }>;
};

type PancakeProductResponse = {
  success?: boolean;
  data?: unknown;
  variations?: unknown[];
  page_number?: number;
  page_size?: number;
  total_entries?: number;
  total_pages?: number;
};

async function fetchPage(
  tenantId: string,
  shopId: string,
  pageNumber: number,
  pageSize: number
): Promise<{ variations: PancakeVariation[]; totalEntries: number; totalPages: number }> {
  const client = await pancakeClientForShop(tenantId, shopId);
  const raw = await client.listProducts({ page_number: pageNumber, page_size: pageSize }) as PancakeProductResponse;

  let variations: PancakeVariation[] = [];

  if (Array.isArray(raw?.data)) {
    variations = raw.data as PancakeVariation[];
  } else if (Array.isArray(raw?.variations)) {
    variations = raw.variations as PancakeVariation[];
  }

  return {
    variations,
    totalEntries: typeof raw?.total_entries === 'number' ? raw.total_entries : 0,
    totalPages: typeof raw?.total_pages === 'number' ? raw.total_pages : 0
  };
}

export async function syncPancakeProductsForShop(params: {
  tenantId: string;
  shopId: string;
  pageSize?: number;
  maxPages?: number;
}): Promise<ProductSyncResult> {
  const { tenantId, shopId, pageSize = 100, maxPages = 20 } = params;

  const result: ProductSyncResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    totalEntries: 0,
    totalPages: 0,
    errors: []
  };

  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const { variations, totalEntries, totalPages } = await fetchPage(tenantId, shopId, currentPage, pageSize);
    result.totalEntries = totalEntries;
    result.totalPages = totalPages;

    for (const variation of variations) {
      try {
        const mapped = mapPancakeVariationToProduct(variation, tenantId);
        if (!mapped) {
          result.skipped += 1;
          continue;
        }

        await upsertProduct({
          tenantId,
          shopId,
          source: mapped.source,
          sourceProductCode: mapped.sourceProductCode,
          productName: mapped.productName,
          productType: mapped.productType,
          unit: mapped.unit,
          defaultInvoiceUnit: mapped.defaultInvoiceUnit,
          groupCode: mapped.groupCode,
          groupName: mapped.groupName,
          status: mapped.status,
          rawJson: mapped.rawJson
        });

        result.synced += 1;
      } catch (err) {
        result.failed += 1;
        result.errors.push({
          code: 'UPSERT_FAILED',
          message: err instanceof Error ? err.message : String(err)
        });
      }
    }

    hasMore = currentPage < totalPages && variations.length > 0;
    currentPage += 1;
  }

  return result;
}
