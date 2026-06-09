'use client';

import { Badge } from '@/components/status/badge';
import { extractBuyer, extractPayment, extractOrderInfo, extractItems, extractShippingAddress } from './order-field-utils';

type Order = Record<string, unknown>;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-3 first:pt-0 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-900">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      </div>
      <div className="divide-y divide-zinc-100 px-5">{children}</div>
    </div>
  );
}

function CustomerInfo({ order }: { order: Order }) {
  const b = extractBuyer(order as Parameters<typeof extractBuyer>[0]);
  return (
    <Section title="Khách hàng">
      <InfoRow label="Tên" value={b.name} />
      <InfoRow label="Điện thoại" value={b.phone} />
      <InfoRow label="Email" value={b.email} />
      <InfoRow label="Địa chỉ" value={b.address} />
      <InfoRow label="Mã số thuế" value={b.taxCode} />
    </Section>
  );
}

function PaymentInfo({ order }: { order: Order }) {
  const p = extractPayment(order as Parameters<typeof extractPayment>[0]);
  return (
    <Section title="Thanh toán">
      <InfoRow label="Tổng tiền" value={<span className="font-semibold">{p.totalPrice} {p.currency}</span>} />
      <InfoRow label="Sau giảm giá" value={p.afterDiscount} />
      <InfoRow label="Cần thu (COD)" value={<span className="text-emerald-700 font-semibold">{p.moneyToCollect} {p.currency}</span>} />
      <InfoRow label="Tiền mặt" value={p.cash} />
      <InfoRow label="Chuyển khoản" value={p.transfer} />
      <InfoRow label="Đã thanh toán trước" value={p.prepaid} />
      <InfoRow label="Phí vận chuyển" value={p.shippingFee} />
      <InfoRow label="Phụ phí" value={p.surcharge} />
      <InfoRow label="Giảm giá" value={p.totalDiscount} />
    </Section>
  );
}

function OrderInfo({ order }: { order: Order }) {
  const info = extractOrderInfo(order as Parameters<typeof extractOrderInfo>[0]);
  return (
    <Section title="Thông tin đơn hàng">
      <InfoRow label="Order ID" value={info.id} />
      <InfoRow label="System ID" value={info.systemId} />
      <InfoRow label="Trạng thái" value={<Badge>{(order as Record<string, unknown>).status_name as string ?? 'unknown'}</Badge>} />
      <InfoRow label="Ngày tạo" value={info.insertedAt ? new Date(info.insertedAt).toLocaleString('vi-VN') : ''} />
      <InfoRow label="Cập nhật lần cuối" value={info.updatedAt ? new Date(info.updatedAt).toLocaleString('vi-VN') : ''} />
      <InfoRow label="Ghi chú" value={info.note} />
      <InfoRow label="Ghi chú in" value={info.notePrint} />
      <InfoRow label="Tags" value={info.tags} />
      <InfoRow
        label="Link Pancake"
        value={
          info.orderLink ? (
            <a href={info.orderLink} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
              Mở trong Pancake
            </a>
          ) : null
        }
      />
    </Section>
  );
}

function ShippingInfo({ order }: { order: Order }) {
  const sa = extractShippingAddress(order as Parameters<typeof extractShippingAddress>[0]);
  return (
    <Section title="Địa chỉ giao hàng">
      <InfoRow label="Tên người nhận" value={sa.fullName} />
      <InfoRow label="SĐT" value={sa.phone} />
      <InfoRow label="Địa chỉ" value={sa.address} />
    </Section>
  );
}

function ItemsTable({ order }: { order: Order }) {
  const items = extractItems(order as Parameters<typeof extractItems>[0]);
  if (items.length === 0) {
    return (
      <Section title="Sản phẩm">
        <p className="py-4 text-sm text-zinc-500">Không có sản phẩm.</p>
      </Section>
    );
  }
  return (
    <Section title={`Sản phẩm (${items.length})`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400">
            <th className="py-2 pr-4 font-medium">#</th>
            <th className="py-2 pr-4 font-medium">Mã</th>
            <th className="py-2 pr-4 font-medium">Tên sản phẩm</th>
            <th className="py-2 pr-4 text-right font-medium">Đơn giá</th>
            <th className="py-2 pr-4 text-right font-medium">SL</th>
            <th className="py-2 pr-4 text-right font-medium">Giảm giá</th>
            <th className="py-2 font-medium">Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item, i) => (
            <tr key={item.id} className="align-top">
              <td className="py-2.5 pr-4 text-zinc-400">{i + 1}</td>
              <td className="py-2.5 pr-4">
                <div className="font-mono text-xs text-zinc-500">{item.displayId || item.barcode || item.variationId}</div>
                <div className="font-mono text-xs text-zinc-400">{item.barcode}</div>
              </td>
              <td className="py-2.5 pr-4 font-medium text-zinc-900">{item.name}</td>
              <td className="py-2.5 pr-4 text-right">{item.unitPrice}</td>
              <td className="py-2.5 pr-4 text-right">{item.quantity}</td>
              <td className="py-2.5 pr-4 text-right text-zinc-500">{item.totalDiscount}</td>
              <td className="py-2.5 text-zinc-400">{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function RawData({ order }: { order: Order }) {
  return (
    <details className="rounded-2xl border border-zinc-200 bg-white">
      <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-700">
        Raw JSON (debug)
      </summary>
      <pre className="max-h-96 overflow-auto px-5 pb-4 text-xs text-zinc-400">
        {JSON.stringify(order, null, 2)}
      </pre>
    </details>
  );
}

export function OrderDetailClient({ order, shopId }: { order: Order; shopId: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <OrderInfo order={order} />
        <CustomerInfo order={order} />
        <ShippingInfo order={order} />
      </div>
      <div className="space-y-6">
        <PaymentInfo order={order} />
      </div>
      <div className="md:col-span-2">
        <ItemsTable order={order} />
      </div>
      <div className="md:col-span-2">
        <RawData order={order} />
      </div>
    </div>
  );
}
