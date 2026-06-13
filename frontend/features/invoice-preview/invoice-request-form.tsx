'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { ApiClientError } from '@/lib/api/client';
import { getDraftStatusClient, getInvoiceBuyerRequestClient, upsertInvoiceBuyerRequestClient, type InvoiceBuyerRequestClient, type InvoiceBuyerRequestInputClient } from '@/features/invoices/invoice-buyer-request-client';

type Props = {
  shopId: string;
  orderId: string;
  onSaved?: (data: InvoiceBuyerRequestClient) => void;
  onChanged?: (hasChanges: boolean) => void;
};

export function InvoiceRequestForm({ shopId, orderId, onSaved, onChanged }: Props) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [buyerType, setBuyerType] = useState<'personal' | 'company'>('personal');
  const [contactName, setContactName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [legalName, setLegalName] = useState('');
  const [buyerUnitName, setBuyerUnitName] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<'saved' | 'pancake' | null>(null);
  const [dirty, setDirty] = useState(false);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId || !orderId) {
      setLoaded(false);
      return;
    }
    setLoading(true);
    setError(null);
    getInvoiceBuyerRequestClient(shopId, orderId)
      .then((data) => {
        if (data) {
          setSource(data.source);
          setBuyerType(data.buyerType);
          setContactName(data.contactName ?? '');
          setBuyerEmail(data.buyerEmail ?? '');
          setBuyerPhone(data.buyerPhone ?? '');
          setInvoiceAddress(data.invoiceAddress ?? '');
          setTaxCode(data.taxCode ?? '');
          setLegalName(data.legalName ?? '');
          setBuyerUnitName(data.buyerUnitName ?? '');
          setIdentityNumber(data.identityNumber ?? '');
          setConfirmed(data.confirmed);
        } else {
          setSource(null);
          setBuyerType('personal');
          setContactName('');
          setBuyerEmail('');
          setBuyerPhone('');
          setInvoiceAddress('');
          setTaxCode('');
          setLegalName('');
          setBuyerUnitName('');
          setIdentityNumber('');
          setConfirmed(false);
        }
        setDirty(false);
        onChanged?.(false);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [shopId, orderId, onChanged]);

  useEffect(() => {
    if (!shopId || !orderId) {
      setDraftWarning(null);
      return;
    }
    getDraftStatusClient(shopId, orderId)
      .then(status => {
        if (status.requiresDraftRecreate || status.outdated) {
          setDraftWarning(status.draftOutdatedMessage || 'Thông tin HĐ đã thay đổi sau khi tạo nháp. Vui lòng tạo lại nháp trước khi phát hành.');
        } else {
          setDraftWarning(null);
        }
      })
      .catch(() => setDraftWarning(null));
  }, [shopId, orderId]);

  function markDirty() {
    setDirty(true);
    onChanged?.(true);
  }

  function buildInput(): InvoiceBuyerRequestInputClient {
    return {
      buyerType,
      contactName: contactName || null,
      buyerEmail: buyerEmail || null,
      buyerPhone: buyerPhone || null,
      invoiceAddress: invoiceAddress || null,
      taxCode: taxCode || null,
      legalName: legalName || null,
      buyerUnitName: buyerUnitName || null,
      identityNumber: identityNumber || null,
      confirmed
    };
  }

  function handleSave() {
    if (!shopId || !orderId) return;
    setError(null);
    setSaved(null);
    startTransition(async () => {
      try {
        const data = await upsertInvoiceBuyerRequestClient(shopId, orderId, buildInput());
        setSaved('Đã lưu thông tin HĐ');
        setSource('saved');
        setDirty(false);
        onSaved?.(data);
        onChanged?.(false);
        setTimeout(() => setSaved(null), 3000);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không lưu được');
      }
    });
  }

  const isCompany = buyerType === 'company';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-zinc-950">Thông tin hóa đơn</h3>
          {source === 'pancake' && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Đã tự điền từ Pancake</span>
          )}
          {source === 'saved' && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Đã lưu thủ công</span>
          )}
          {dirty && <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Có thay đổi chưa lưu</span>}
        </div>
        <div className="text-right">
          {loading && <span className="text-sm text-zinc-400">Đang tải...</span>}
          {saved && <span className="text-sm text-emerald-600">{saved}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {draftWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {draftWarning}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">Loại khách hàng</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setBuyerType('personal'); markDirty(); }}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                buyerType === 'personal'
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-700'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              Cá nhân
            </button>
            <button
              type="button"
              onClick={() => { setBuyerType('company'); markDirty(); }}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                buyerType === 'company'
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-700'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              Công ty
            </button>
          </div>
        </div>

        <TextInput
          label="Tên người liên hệ"
          value={contactName}
          onChange={e => { setContactName(e.target.value); markDirty(); }}
          placeholder="Họ tên"
        />

        <TextInput
          label="Email nhận hóa đơn"
          type="email"
          value={buyerEmail}
          onChange={e => { setBuyerEmail(e.target.value); markDirty(); }}
          placeholder="email@example.com"
        />

        <TextInput
          label="Số điện thoại"
          value={buyerPhone}
          onChange={e => { setBuyerPhone(e.target.value); markDirty(); }}
          placeholder="0xxx..."
        />

        <TextInput
          label="Địa chỉ xuất hóa đơn"
          value={invoiceAddress}
          onChange={e => { setInvoiceAddress(e.target.value); markDirty(); }}
          placeholder="Địa chỉ đầy đủ"
        />

        {isCompany && (
          <>
            <TextInput
              label="Mã số thuế *"
              value={taxCode}
              onChange={e => { setTaxCode(e.target.value); markDirty(); }}
              placeholder="MST 10 hoặc 13 chữ số"
            />
            <TextInput
              label="Tên công ty / Đơn vị *"
              value={buyerUnitName}
              onChange={e => { setBuyerUnitName(e.target.value); markDirty(); }}
              placeholder="Tên công ty hoặc đơn vị"
            />
            <TextInput
              label="Tên pháp lý"
              value={legalName}
              onChange={e => { setLegalName(e.target.value); markDirty(); }}
              placeholder="Tên pháp lý công ty"
            />
          </>
        )}

        {!isCompany && (
          <TextInput
            label="Số CCCD/ĐDCN"
            value={identityNumber}
            onChange={e => { setIdentityNumber(e.target.value); markDirty(); }}
            placeholder="Số CCCD/ĐDCN (nếu có)"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => { setConfirmed(e.target.checked); markDirty(); }}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span className="text-sm text-zinc-700">Tôi đã xác nhận thông tin hóa đơn trên là chính xác</span>
        </label>
      </div>

      {isCompany && taxCode && !/^\d{10}(\d{3})?$/.test(taxCode.replace(/\s/g, '')) && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Mã số thuế phải gồm 10 hoặc 13 chữ số
        </div>
      )}

      {isCompany && (!buyerUnitName || !invoiceAddress) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Hóa đơn công ty cần tên công ty/tên đơn vị và địa chỉ xuất hóa đơn trước khi tạo nháp.
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending || !shopId || !orderId}>
          {isPending ? 'Đang lưu...' : 'Lưu thông tin HĐ'}
        </Button>
        {isCompany && !taxCode && (
          <span className="text-sm text-amber-600">Cần nhập MST để tạo hóa đơn công ty</span>
        )}
      </div>
    </div>
  );
}
