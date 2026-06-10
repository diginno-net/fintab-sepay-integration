'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/forms/button';
import { OrderDetailClient } from '@/features/orders/order-detail-client';
import { OrderInvoicePanel } from '@/features/orders/order-invoice-panel';

type OrderDetailPageClientProps = {
  order: Record<string, unknown>;
  shopId: string;
  orderId: string;
};

export function OrderDetailPageClient({ order, shopId, orderId }: OrderDetailPageClientProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'invoices'>('details');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'border-b-2 border-emerald-700 text-emerald-700'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Thông tin đơn
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'border-b-2 border-emerald-700 text-emerald-700'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          Hóa đơn
        </button>
      </div>

      {activeTab === 'details' && (
        <OrderDetailClient order={order} shopId={shopId} />
      )}

      {activeTab === 'invoices' && (
        <OrderInvoicePanel orderId={orderId} shopId={shopId} />
      )}
    </div>
  );
}
