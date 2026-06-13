'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { SelectInput } from '@/components/forms/select';
import { OrderPicker } from '@/components/ui/order-picker';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import { InvoicePreviewSummary } from './invoice-preview-summary';
import { listTenantShopsClient } from '@/features/shops/api-client';
import { useEffect } from 'react';
import { InvoiceRequestForm } from './invoice-request-form';
import { getDraftStatusClient } from '@/features/invoices/invoice-buyer-request-client';

export function InvoicePreviewForm({ defaultShopId, defaultOrderId }: { defaultShopId: string; defaultOrderId?: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showRaw, setShowRaw] = useState(false);
  const [shops, setShops] = useState<Array<{ id: string; shop_name: string }>>([]);
  const [shopId, setShopId] = useState(defaultShopId);
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [invoiceType, setInvoiceType] = useState<'ban_hang' | 'gtgt'>('ban_hang');
  const [requestChanged, setRequestChanged] = useState(false);
  const [draftOutdated, setDraftOutdated] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        const data = await listTenantShopsClient();
        setShops(data);
        if (!defaultShopId && data.length > 0) {
          setShopId(data[0].id);
        }
      } catch {
        setShops([]);
      }
    }
    loadShops();
  }, [defaultShopId]);

  useEffect(() => {
    setPreview(null);
    setRequestChanged(false);
    setDraftOutdated(false);
    setDraftStatus(null);
    if (shopId && orderId) {
      getDraftStatusClient(shopId, orderId).then(status => {
        setDraftOutdated(status.outdated);
        setDraftStatus(status.draftStatus ?? null);
      }).catch(() => {});
    }
  }, [orderId, shopId]);

  async function handlePreview() {
    if (!shopId || !orderId) {
      setMessage('Vui lòng chọn cửa hàng và mã đơn hàng');
      return;
    }
    setMessage(null);
    setPreview(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<Record<string, unknown>>('/v1/invoices/preview', {
          method: 'POST',
          body: JSON.stringify({ shopId, orderId, invoiceType })
        });
        setPreview(data);
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không tạo được preview.');
      }
    });
  }

  async function handleCreateDraft() {
    if (!shopId || !orderId) {
      setMessage('Vui lòng chọn cửa hàng và mã đơn hàng');
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const data = await apiFetch<{ backgroundJobId: string; invoiceJob: { id: string } }>('/v1/invoices/create-draft', {
          method: 'POST',
          body: JSON.stringify({ shopId, orderId, invoiceType })
        });
        router.push(`/jobs?invoiceJobId=${data.invoiceJob.id}`);
      } catch (error) {
        setMessage(error instanceof ApiClientError ? error.message : 'Không tạo được draft job.');
      }
    });
  }

  const hasBlockingWarning = Boolean(
    Array.isArray((preview as { warnings?: Array<{ code: string }> })?.warnings)
    && ((preview as { warnings?: Array<{ code: string }> }).warnings ?? []).some(w => w.code === 'TAX_MAPPING_BLOCKED')
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="mb-5 text-lg font-semibold text-zinc-950">Tạo hóa đơn điện tử</h3>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">Cửa hàng</label>
            <select
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700"
            >
              <option value="">Chọn cửa hàng</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.shop_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">Mã đơn hàng</label>
            <OrderPicker
              shopId={shopId}
              value={orderId}
              onChange={setOrderId}
              placeholder="Tìm kiếm đơn hàng..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-800">Loại hóa đơn</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInvoiceType('ban_hang')}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  invoiceType === 'ban_hang'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                }`}
              >
                Bán hàng
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('gtgt')}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  invoiceType === 'gtgt'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                }`}
              >
                GTGT
              </button>
            </div>
          </div>
        </div>

        {shopId && orderId && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
            <InvoiceRequestForm
              shopId={shopId}
              orderId={orderId}
              onChanged={setRequestChanged}
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={handlePreview} disabled={isPending || !shopId || !orderId}>
            {isPending ? 'Đang preview...' : 'Xem trước'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCreateDraft}
            disabled={isPending || !preview || hasBlockingWarning || !shopId || !orderId}
          >
            Tạo nháp
          </Button>
          {preview ? (
            <button
              type="button"
              onClick={() => setShowRaw(v => !v)}
              className="text-sm text-zinc-500 underline"
            >
              {showRaw ? 'Ẩn JSON' : 'Xem JSON'}
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      ) : null}

      {draftOutdated && draftStatus ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Thông tin HĐ đã thay đổi sau khi tạo nháp</p>
          <p className="mt-1">Nhấn "Tạo nháp" sẽ tạo nháp mới với thông tin hiện tại. Vui lòng tạo lại nháp trước khi phát hành.</p>
        </div>
      ) : null}

      {preview ? (
        showRaw ? (
          <details className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-600">JSON thô</summary>
            <pre className="max-h-96 overflow-auto px-4 pb-4 text-xs text-zinc-400">{JSON.stringify(preview, null, 2)}</pre>
          </details>
        ) : (
          <InvoicePreviewSummary data={preview as Parameters<typeof InvoicePreviewSummary>[0]['data']} />
        )
      ) : null}
    </div>
  );
}
