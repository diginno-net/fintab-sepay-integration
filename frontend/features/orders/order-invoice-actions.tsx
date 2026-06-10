'use client';

import Link from 'next/link';
import { Badge } from '@/components/status/badge';
import { Button } from '@/components/forms/button';

type OrderInvoiceActionsProps = {
  orderId: string;
  shopId: string;
  invoiceJobStatus?: string;
  className?: string;
};

export function OrderInvoiceActions({ orderId, shopId, invoiceJobStatus, className = '' }: OrderInvoiceActionsProps) {
  const getInvoiceBadge = () => {
    switch (invoiceJobStatus) {
      case 'issued':
        return <Badge tone="success">Đã phát hành</Badge>;
      case 'draft_created':
        return <Badge tone="warning">Nháp xong</Badge>;
      case 'failed':
      case 'timeout':
        return <Badge tone="danger">Lỗi</Badge>;
      default:
        return <Badge tone="neutral">Chưa tạo</Badge>;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {invoiceJobStatus && getInvoiceBadge()}
      <Link href={`/orders/${orderId}?shopId=${shopId}`}>
        <Button size="sm" variant="ghost">Chi tiết</Button>
      </Link>
      <Link href={`/invoices/preview?shopId=${shopId}&orderId=${orderId}`}>
        <Button size="sm" variant="secondary">Tạo HĐ</Button>
      </Link>
    </div>
  );
}
