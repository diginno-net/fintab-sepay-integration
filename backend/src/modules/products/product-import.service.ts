import * as XLSX from 'xlsx';
import { upsertProduct, normalizeProductType, defaultInvoiceUnit } from './product-catalog.service.js';

export type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

type RawProductRow = Record<string, unknown>;

export async function importFintabProducts(tenantId: string, buffer: Buffer, filename: string): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Products') ? 'Products' : workbook.SheetNames[0];
  const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!worksheet) throw new Error('Excel file has no worksheet');
  const rows = XLSX.utils.sheet_to_json<RawProductRow>(worksheet, { defval: null });
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const code = stringValue(row['Mã hàng hoá'] ?? row['Mã hàng hóa'] ?? row['SKU'] ?? row['Barcode']);
    const name = stringValue(row['Tên hàng hoá'] ?? row['Tên hàng hóa'] ?? row['Tên sản phẩm']);
    if (!code || !name) {
      result.skipped += 1;
      result.errors.push({ row: rowNumber, message: 'Missing product code or name' });
      continue;
    }
    try {
      await upsertProduct({
        tenantId,
        source: 'fintab_export',
        sourceProductCode: code,
        productName: name,
        productType: normalizeProductType(stringValue(row['Loại'])),
        unit: stringValue(row['Đơn vị tính']),
        defaultInvoiceUnit: defaultInvoiceUnit(stringValue(row['Đơn vị tính'])),
        allowNegativeStock: parseBoolean(row['Cho phép xuất âm']),
        groupCode: stringValue(row['Mã nhóm hàng hoá'] ?? row['Mã nhóm hàng hóa']),
        groupName: stringValue(row['Nhóm hàng hoá'] ?? row['Nhóm hàng hóa']),
        warehouseCode: stringValue(row['Mã kho']),
        businessCategory: stringValue(row['Nhóm ngành nghề']),
        exciseTax: stringValue(row['Thuế tiêu thụ đặc biệt']),
        status: stringValue(row['Trạng thái']) || 'active',
        rawJson: { export_file: filename, raw_row: row }
      });
      result.updated += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({ row: rowNumber, message: error instanceof Error ? error.message : 'Unknown import error' });
    }
  }

  return result;
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseBoolean(value: unknown): boolean {
  const text = stringValue(value)?.toLowerCase();
  return text === '1' || text === 'true' || text === 'có' || text === 'yes';
}
