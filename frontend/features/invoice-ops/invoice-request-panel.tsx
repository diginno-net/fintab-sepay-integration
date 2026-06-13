'use client';

import { Button } from '@/components/forms/button';
import { InvoiceRequestForm } from '@/features/invoice-preview/invoice-request-form';

type Props = {
  open: boolean;
  shopId: string;
  orderId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function InvoiceRequestPanel({ open, shopId, orderId, onClose, onSaved }: Props) {
  if (!open || !orderId) return null;
  return (
    <div className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-auto bg-[#fbfaf7] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Thông tin HĐ</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">Đơn #{orderId}</h2>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5">
          <InvoiceRequestForm shopId={shopId} orderId={orderId} onSaved={() => { onSaved(); onClose(); }} />
        </div>
      </div>
    </div>
  );
}
