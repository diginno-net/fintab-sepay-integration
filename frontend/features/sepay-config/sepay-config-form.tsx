'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { ProviderAccountPicker } from './provider-account-picker';
import type { MaskedSepayConfig } from '@/features/shops/api';

export function SepayConfigForm({ shopId, config }: { shopId: string; config: MaskedSepayConfig }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const current = config?.config ?? {};

  function save(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/shops/${shopId}/sepay/config`, {
          method: 'PUT',
          body: JSON.stringify({
            env: formData.get('env'),
            client_id: valueOrUndefined(formData.get('client_id')),
            client_secret: valueOrUndefined(formData.get('client_secret')),
            provider_account_id: formData.get('provider_account_id'),
            template_code: formData.get('template_code'),
            invoice_series: formData.get('invoice_series'),
            default_payment_method: formData.get('default_payment_method'),
            default_tax_rate: Number(formData.get('default_tax_rate'))
          })
        });
        setMessage('Đã lưu cấu hình SePay.');
        router.refresh();
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không lưu được cấu hình SePay.');
      }
    });
  }

  function testConnection() {
    setMessage(null);
    startTransition(async () => {
      try {
        await apiFetch(`/v1/shops/${shopId}/sepay/test`, { method: 'POST', body: JSON.stringify({}) });
        setMessage('Kết nối SePay thành công.');
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không kiểm tra được kết nối SePay.');
      }
    });
  }

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <SelectInput label="Environment" name="env" defaultValue={String(current.env ?? 'sandbox')}><option value="sandbox">Sandbox</option><option value="production">Production</option></SelectInput>
        <SelectInput label="Template" name="template_code" defaultValue={String(current.template_code ?? '2')}><option value="2">Bán hàng</option><option value="1">GTGT</option></SelectInput>
        <TextInput label="Client ID" name="client_id" placeholder={config?.has_client_id ? '••••••••' : ''} helper="Write-only. Để trống nếu không đổi." />
        <TextInput label="Client secret" name="client_secret" type="password" placeholder={config?.has_client_secret ? '••••••••' : ''} helper="Write-only. Để trống nếu không đổi." />
        <div className="md:col-span-2 p-4 border border-zinc-200 rounded-xl space-y-3 bg-zinc-50">
          <p className="text-sm font-medium text-zinc-700">Tài khoản phát hành từ SePay</p>
          <ProviderAccountPicker
            shopId={shopId}
            onAccountLoaded={(accountId) => {
              const el = document.getElementById('provider_account_id_input') as HTMLInputElement | null;
              if (el) el.value = accountId;
            }}
            onTemplateLoaded={(templateCode, invoiceSeries) => {
              const tplEl = document.getElementById('template_code_input') as HTMLInputElement | null;
              const seriesEl = document.getElementById('invoice_series_input') as HTMLInputElement | null;
              if (tplEl) tplEl.value = templateCode;
              if (seriesEl) seriesEl.value = invoiceSeries;
            }}
          />
          <p className="text-xs text-zinc-500">
            Hoặc nhập thủ công. Đảm bảo nhập đúng <strong>Provider Account ID</strong> từ SePay — không phải mã Shop ID từ Pancake.
          </p>
        </div>
        <input id="provider_account_id_input" type="hidden" name="provider_account_id" defaultValue={String(current.provider_account_id ?? '')} />
        <input id="invoice_series_input" type="hidden" name="invoice_series" defaultValue={String(current.invoice_series ?? '')} />
        <SelectInput label="Payment method" name="default_payment_method" defaultValue={String(current.default_payment_method ?? 'TM/CK')}><option value="TM">TM</option><option value="CK">CK</option><option value="TM/CK">TM/CK</option><option value="KHAC">KHAC</option></SelectInput>
        <SelectInput label="Default tax rate" name="default_tax_rate" defaultValue={String(current.default_tax_rate ?? 10)}><option value="-2">Không chịu thuế</option><option value="-1">Không kê khai</option><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></SelectInput>
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu cấu hình'}</Button><Button type="button" variant="secondary" onClick={testConnection} disabled={isPending}>{isPending ? 'Đang kiểm tra...' : 'Test SePay'}</Button></div>
    </form>
  );
}

function valueOrUndefined(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : undefined;
}
