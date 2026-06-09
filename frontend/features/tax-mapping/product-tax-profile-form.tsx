'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';

export function ProductTaxProfileForm({ productId, profile }: { productId: string; profile: Record<string, unknown> | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/products/${productId}/tax-profile`, {
          method: 'PUT',
          body: JSON.stringify({
            tenantShopId: null,
            taxRate: Number(formData.get('taxRate')),
            taxCategory: formData.get('taxCategory'),
            invoiceLineType: Number(formData.get('invoiceLineType')),
            invoiceUnit: formData.get('invoiceUnit'),
            isTaxInclusivePrice: true
          })
        });
        setMessage('Đã lưu tax profile.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không lưu được tax profile.');
      }
    });
  }

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <SelectInput label="Tax rate" name="taxRate" defaultValue={String(profile?.tax_rate ?? 10)}><option value="-2">Không chịu thuế</option><option value="-1">Không kê khai</option><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></SelectInput>
        <SelectInput label="Tax category" name="taxCategory" defaultValue={String(profile?.tax_category ?? 'taxable')}><option value="taxable">Taxable</option><option value="non_taxable">Non taxable</option><option value="non_declarable">Non declarable</option><option value="zero_rated">Zero rated</option></SelectInput>
        <SelectInput label="Invoice line type" name="invoiceLineType" defaultValue={String(profile?.invoice_line_type ?? 1)}><option value="1">Hàng hóa/dịch vụ</option><option value="2">Khuyến mại</option><option value="3">Chiết khấu</option><option value="4">Ghi chú</option></SelectInput>
        <TextInput label="Invoice unit" name="invoiceUnit" defaultValue={String(profile?.invoice_unit ?? 'cái')} />
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu tax profile'}</Button>
    </form>
  );
}
