'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';

export function ProductTaxProfileForm({ productId, shopId, profile }: { productId: string; shopId: string | null; profile: Record<string, unknown> | null }) {
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
            tenantShopId: shopId,
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
      {shopId ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Hồ sơ thuế này sẽ được lưu theo cửa hàng hiện tại.
        </p>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Chưa xác định cửa hàng, hồ sơ thuế sẽ không được lưu theo cửa hàng cụ thể.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        <SelectInput label="Thuế suất" name="taxRate" defaultValue={String(profile?.tax_rate ?? 10)}><option value="-2">Không chịu thuế</option><option value="-1">Không kê khai</option><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></SelectInput>
        <SelectInput label="Nhóm thuế" name="taxCategory" defaultValue={String(profile?.tax_category ?? 'taxable')}><option value="taxable">Chịu thuế</option><option value="non_taxable">Không chịu thuế</option><option value="non_declarable">Không kê khai</option><option value="zero_rated">Thuế suất 0%</option></SelectInput>
        <SelectInput label="Loại dòng hóa đơn" name="invoiceLineType" defaultValue={String(profile?.invoice_line_type ?? 1)}><option value="1">Hàng hóa/dịch vụ</option><option value="2">Khuyến mại</option><option value="3">Chiết khấu</option><option value="4">Ghi chú</option></SelectInput>
        <TextInput label="Đơn vị hóa đơn" name="invoiceUnit" defaultValue={String(profile?.invoice_unit ?? 'cái')} />
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu hồ sơ thuế'}</Button>
    </form>
  );
}
