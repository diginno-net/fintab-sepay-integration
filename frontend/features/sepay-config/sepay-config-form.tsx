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
            default_tax_rate: Number(formData.get('default_tax_rate')),
            dry_run: checked(formData, 'dry_run'),
            auto_create_invoice: checked(formData, 'auto_create_invoice'),
            auto_issue_invoice: checked(formData, 'auto_issue_invoice'),
            require_accountant_confirmation_before_auto_issue: checked(formData, 'require_accountant_confirmation_before_auto_issue')
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
        const result = await apiFetch<{ ok: boolean; error?: { message?: string } }>(`/v1/shops/${shopId}/sepay/test`, { method: 'POST', body: JSON.stringify({}) });
        if (!result.ok) throw new Error(result.error?.message ?? 'Kết nối SePay thất bại.');
        setMessage('Kết nối SePay thành công.');
      } catch (error) {
        setMessage(error instanceof ApiClientError || error instanceof Error ? error.message : 'Không kiểm tra được kết nối SePay.');
      }
    });
  }

  return (
    <form action={save} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <SelectInput label="Môi trường" name="env" defaultValue={String(current.env ?? 'sandbox')}><option value="sandbox">Sandbox</option><option value="production">Production</option></SelectInput>
        <SelectInput label="Mẫu hóa đơn" name="template_code" defaultValue={String(current.template_code ?? '2')}><option value="2">Bán hàng</option><option value="1">GTGT</option></SelectInput>
        <TextInput
          label="Client ID"
          name="client_id"
          autoComplete="off"
          placeholder={config?.has_client_id ? '••••••••' : ''}
          helper="API Client ID của SePay eInvoice, không phải tài khoản đăng nhập như admin. Để trống nếu không đổi."
        />
        <TextInput
          label="Client secret"
          name="client_secret"
          type="password"
          autoComplete="new-password"
          placeholder={config?.has_client_secret ? '••••••••' : ''}
          helper="API Client Secret của SePay eInvoice. Để trống nếu không đổi."
        />
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
            Hoặc nhập thủ công. <strong>Mã tài khoản nhà cung cấp</strong> là tài khoản phát hành từ SePay, không phải mã cửa hàng từ Pancake.
          </p>
          <p className="text-xs text-amber-700">
            Nếu đang test sandbox, hãy dùng đúng API Client ID/Secret sandbox do SePay cấp. Giá trị như "admin" thường là tài khoản đăng nhập, không phải API credential.
          </p>
        </div>
        <input id="provider_account_id_input" type="hidden" name="provider_account_id" defaultValue={String(current.provider_account_id ?? '')} />
        <input id="invoice_series_input" type="hidden" name="invoice_series" defaultValue={String(current.invoice_series ?? '')} />
        <SelectInput label="Phương thức thanh toán" name="default_payment_method" defaultValue={String(current.default_payment_method ?? 'TM/CK')}><option value="TM">TM</option><option value="CK">CK</option><option value="TM/CK">TM/CK</option><option value="KHAC">KHAC</option></SelectInput>
        <SelectInput label="Thuế suất mặc định" name="default_tax_rate" defaultValue={String(current.default_tax_rate ?? 10)}><option value="-2">Không chịu thuế</option><option value="-1">Không kê khai</option><option value="0">0%</option><option value="5">5%</option><option value="8">8%</option><option value="10">10%</option></SelectInput>
      </div>

      <div className="border-t border-line pt-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <AutomationToggle
            name="dry_run"
            title="Chạy thử"
            description="Chỉ kiểm tra dữ liệu, không tạo hóa đơn thật."
            defaultChecked={current.dry_run !== false}
          />
          <AutomationToggle
            name="auto_create_invoice"
            title="Tự động tạo hóa đơn"
            description="Tự tạo hóa đơn khi đơn hàng đã thanh toán."
            defaultChecked={current.auto_create_invoice === true}
          />
          <AutomationToggle
            name="auto_issue_invoice"
            title="Tự động phát hành"
            description="Phát hành hóa đơn ngay sau khi tạo nháp."
            defaultChecked={current.auto_issue_invoice === true}
          />
          <AutomationToggle
            name="require_accountant_confirmation_before_auto_issue"
            title="Yêu cầu kế toán xác nhận trước khi tự động phát hành"
            description="Khi bật tự động phát hành, chỉ phát hành đơn đã được xác nhận Thông tin hóa đơn."
            defaultChecked={current.require_accountant_confirmation_before_auto_issue !== false}
          />
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Trước khi chạy hóa đơn thật</p>
          <p className="mt-1">Hóa đơn thật có giá trị pháp lý. Ở giai đoạn đầu, nên tạo nháp và phát hành thủ công để kế toán kiểm tra PDF/XML trước.</p>
        </div>
      </div>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={isPending}>{isPending ? 'Đang lưu...' : 'Lưu cấu hình'}</Button><Button type="button" variant="secondary" onClick={testConnection} disabled={isPending}>{isPending ? 'Đang kiểm tra...' : 'Kiểm tra SePay'}</Button></div>
    </form>
  );
}

function valueOrUndefined(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text : undefined;
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === 'on';
}

function AutomationToggle({ name, title, description, defaultChecked }: { name: string; title: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3">
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
      </span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 size-5 rounded border-line text-accent" />
    </label>
  );
}
