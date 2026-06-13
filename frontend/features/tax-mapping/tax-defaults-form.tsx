'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import type { ShopTaxDefaults } from '@/features/shops/api';

export function TaxDefaultsForm({ shopId, defaults }: { shopId: string; defaults: ShopTaxDefaults }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/shops/${shopId}/tax/defaults`, {
          method: 'PUT',
          body: JSON.stringify({
            defaultTaxRate: Number(formData.get('defaultTaxRate')),
            defaultInvoiceUnit: formData.get('defaultInvoiceUnit'),
            defaultInvoiceType: formData.get('defaultInvoiceType'),
            unknownProductPolicy: formData.get('unknownProductPolicy')
          })
        });
        setMessage('Đã lưu tax defaults.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không lưu được tax defaults.');
      }
    });
  }

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <SelectInput label="Thuế suất mặc định" name="defaultTaxRate" defaultValue={String(defaults?.default_tax_rate ?? 10)}><option value="-2">Không chịu thuế</option><option value="-1">Không kê khai</option><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></SelectInput>
        <TextInput label="Đơn vị hóa đơn mặc định" name="defaultInvoiceUnit" defaultValue={defaults?.default_invoice_unit ?? 'cái'} />
        <SelectInput label="Loại hóa đơn mặc định" name="defaultInvoiceType" defaultValue={defaults?.default_invoice_type ?? 'ban_hang'}><option value="ban_hang">Bán hàng</option><option value="gtgt">GTGT</option></SelectInput>
        <SelectInput label="Cách xử lý sản phẩm chưa map" name="unknownProductPolicy" defaultValue={defaults?.unknown_product_policy ?? 'warn'}><option value="warn">Cảnh báo</option><option value="block">Chặn xử lý</option><option value="use_default">Dùng mặc định</option></SelectInput>
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu cấu hình thuế mặc định'}</Button>
    </form>
  );
}
