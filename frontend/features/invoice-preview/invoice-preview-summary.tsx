'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

type MappingWarning = {
  code: string;
  message: string;
  lineNumber?: number;
};

type TaxResolutionItem = {
  lineNumber: number;
  source: string;
  taxRate: number | null;
  shouldBlock: boolean;
  productId: string | null;
};

type Buyer = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_code?: string | null;
};

type InvoiceItem = {
  line_number: number;
  line_type: number;
  item_code: string;
  item_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
};

type InvoicePreviewResponse = {
  payload: {
    template_code: string;
    currency: string;
    payment_method: string;
    is_draft: boolean;
    buyer: Buyer;
    items: InvoiceItem[];
    notes?: string;
  };
  warnings: MappingWarning[];
  taxResolution: TaxResolutionItem[];
};

function WarningBadge({ warning }: { warning: MappingWarning }) {
  const isBlocking = warning.code === 'TAX_MAPPING_BLOCKED';
  const color = isBlocking ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${color}`}>
      <span className="font-semibold">{warning.lineNumber ? `Line ${warning.lineNumber}: ` : ''}{warning.code}</span>
      <span> — {warning.message}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between border-b border-zinc-100 py-2.5 text-sm last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

export function InvoicePreviewSummary({ data }: { data: InvoicePreviewResponse }) {
  const { payload, warnings, taxResolution } = data;
  const { buyer, items, payment_method, notes } = payload;

  const hasBlockingWarning = warnings.some(w => w.code === 'TAX_MAPPING_BLOCKED');
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalTax = items.reduce((sum, item) => {
    const taxRes = taxResolution.find(t => t.lineNumber === item.line_number);
    const rate = item.tax_rate ?? taxRes?.taxRate ?? 0;
    return sum + (item.quantity * item.unit_price * rate / 100);
  }, 0);

  return (
    <div className="space-y-5">
      {hasBlockingWarning && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Không thể tạo hóa đơn</p>
          <p className="mt-1 text-sm text-red-700">Có lỗi nghiêm trọng. Vui lòng kiểm tra các cảnh báo bên dưới.</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-700">Cảnh báo ({warnings.length})</h4>
          {warnings.map((w, i) => <WarningBadge key={i} warning={w} />)}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Người mua</h4>
          </div>
          <div className="divide-y divide-zinc-100 px-4">
            <InfoRow label="Tên" value={buyer.name} />
            <InfoRow label="Điện thoại" value={buyer.phone} />
            <InfoRow label="Email" value={buyer.email} />
            <InfoRow label="Địa chỉ" value={buyer.address} />
            <InfoRow label="Mã số thuế" value={buyer.tax_code || '-'} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Thông tin hóa đơn</h4>
          </div>
          <div className="divide-y divide-zinc-100 px-4">
            <InfoRow label="Loại" value={payload.template_code === '1' ? 'GTGT' : 'Bán hàng'} />
            <InfoRow label="Thanh toán" value={payment_method} />
            <InfoRow label="Tiền tệ" value={payload.currency} />
            <InfoRow label="Số sản phẩm" value={items.length} />
            <InfoRow label="Tổng tiền" value={<span className="font-semibold text-emerald-700">{totalAmount.toLocaleString('vi-VN')} {payload.currency}</span>} />
            {notes ? <InfoRow label="Ghi chú" value={notes} /> : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sản phẩm ({items.length})</h4>
          <div className="flex gap-4 text-sm">
            <span className="text-zinc-500">Tổng: <span className="font-semibold text-zinc-900">{totalAmount.toLocaleString('vi-VN')}</span></span>
            <span className="text-zinc-500">Thuế: <span className="font-semibold text-emerald-700">{totalTax.toLocaleString('vi-VN')}</span></span>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 pr-4">#</th>
              <th className="py-2.5 pr-4">Mã</th>
              <th className="py-2.5 pr-4">Tên</th>
              <th className="py-2.5 pr-4 text-right">Đơn giá</th>
              <th className="py-2.5 pr-4 text-right">SL</th>
              <th className="py-2.5 pr-4 text-right">Thành tiền</th>
              <th className="py-2.5 text-right">Thuế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map(item => {
              const taxRes = taxResolution.find(t => t.lineNumber === item.line_number);
              const lineTotal = item.quantity * item.unit_price;
              return (
                <tr key={item.line_number} className="align-top">
                  <td className="py-2.5 pr-4 text-zinc-400">{item.line_number}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">{item.item_code}</td>
                  <td className="py-2.5 pr-4 font-medium">{item.item_name}</td>
                  <td className="py-2.5 pr-4 text-right">{item.unit_price.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 pr-4 text-right">{item.quantity}</td>
                  <td className="py-2.5 pr-4 text-right font-medium">{lineTotal.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 text-right">
                    {taxRes ? (
                      taxRes.shouldBlock ? (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Chặn</span>
                      ) : (
                        <span className={`text-xs ${taxRes.source === 'product_profile' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.tax_rate ?? taxRes.taxRate ?? 0}%
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
