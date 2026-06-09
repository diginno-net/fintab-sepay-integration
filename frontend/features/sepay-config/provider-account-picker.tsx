'use client';

import { useState } from 'react';
import { Button } from '@/components/forms/button';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';

type ProviderAccount = {
  id: string;
  name?: string;
  provider_account_id?: string;
  email?: string;
  status?: string;
};

type AccountDetail = {
  provider_account_id?: string;
  name?: string;
  templates?: Array<{
    template_code?: string;
    invoice_series?: string;
    template_name?: string;
    invoice_label?: string;
  }>;
};

export type ProviderAccountPickerProps = {
  shopId: string;
  onAccountLoaded?: (accountId: string, accountName?: string) => void;
  onTemplateLoaded?: (templateCode: string, invoiceSeries: string) => void;
};

export function ProviderAccountPicker({ shopId, onAccountLoaded, onTemplateLoaded }: ProviderAccountPickerProps) {
  const [accounts, setAccounts] = useState<ProviderAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [templates, setTemplates] = useState<AccountDetail['templates']>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAccounts() {
    setLoadingAccounts(true);
    setError(null);
    setSelectedAccountId('');
    setTemplates([]);
    try {
      const res = await apiFetch<{ data: unknown }>(`/v1/shops/${shopId}/sepay/provider-accounts`);
      const raw = res.data;
      const items = extractArray(raw);
      setAccounts(items);
      if (items.length === 0) setError('Không tìm thấy tài khoản phát hành active.');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Không tải được danh sách tài khoản.');
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadAccountDetail(accountId: string) {
    setSelectedAccountId(accountId);
    setTemplates([]);
    setLoadingDetail(true);
    try {
      const res = await apiFetch<{ data: AccountDetail }>(`/v1/shops/${shopId}/sepay/provider-accounts/${encodeURIComponent(accountId)}`);
      const detail = res.data;
      setTemplates(detail.templates ?? []);
      onAccountLoaded?.(accountId, detail.name);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Không tải được chi tiết tài khoản.');
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleTemplateChange(templateValue: string) {
    if (!templateValue) return;
    const [templateCode, invoiceSeries] = templateValue.split('|');
    onTemplateLoaded?.(templateCode, invoiceSeries);
  }

  const accountLabel = (acc: ProviderAccount) =>
    acc.name || acc.provider_account_id || acc.id;

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        onClick={loadAccounts}
        disabled={loadingAccounts}
      >
        {loadingAccounts ? 'Đang tải...' : 'Tải tài khoản từ SePay'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {accounts.length > 0 && (
        <SelectInput
          label="Tài khoản phát hành"
          value={selectedAccountId}
          onChange={e => loadAccountDetail(e.target.value)}
        >
          <option value="">-- Chọn tài khoản --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {accountLabel(acc)} {acc.status ? `(${acc.status})` : ''}
            </option>
          ))}
        </SelectInput>
      )}

      {loadingDetail && <p className="text-sm text-zinc-500">Đang tải mẫu hóa đơn...</p>}

      {(templates ?? []).length > 0 && (
        <SelectInput
          label="Mẫu hóa đơn"
          onChange={e => handleTemplateChange(e.target.value)}
        >
          <option value="">-- Chọn mẫu --</option>
          {(templates ?? []).map((t, i) => {
            const code = t.template_code ?? '';
            const series = t.invoice_series ?? '';
            const label = t.invoice_label ?? t.template_name ?? `${code} / ${series}`;
            const value = `${code}|${series}`;
            return (
              <option key={i} value={value}>
                {label}
              </option>
            );
          })}
        </SelectInput>
      )}
    </div>
  );
}

function extractArray(value: unknown): ProviderAccount[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as ProviderAccount[];
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ProviderAccount[];
    if (Array.isArray(obj.items)) return obj.items as ProviderAccount[];
    return [obj as ProviderAccount];
  }
  return [];
}
