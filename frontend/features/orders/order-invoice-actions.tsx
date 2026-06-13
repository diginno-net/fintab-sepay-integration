'use client';

import Link from 'next/link';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';
import { invoiceStatus } from '@/features/operations/status-labels';

type OrderInvoiceActionsProps = {
  orderId: string;
  shopId: string;
  invoiceJobStatus?: string;
  className?: string;
};

export function OrderInvoiceActions({ orderId, shopId, invoiceJobStatus, className = '' }: OrderInvoiceActionsProps) {
  const status = invoiceJobStatus ? invoiceStatus(invoiceJobStatus) : { label: 'Chưa tạo', tone: 'neutral' as const };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {invoiceJobStatus && <Badge tone={status.tone}>{status.label}</Badge>}
      <Link href={`/orders/${orderId}?shopId=${shopId}`}>
        <Button size="sm" variant="ghost">Chi tiết</Button>
      </Link>
      <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId}`}>
        <Button size="sm" variant="secondary">Tạo nháp</Button>
      </Link>
    </div>
  );
}
