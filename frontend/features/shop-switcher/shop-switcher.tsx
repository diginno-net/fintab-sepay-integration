'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SessionShop } from '@/features/auth/session';
import { apiFetch } from '@/lib/api/client';
import { resolveCurrentShopId } from './shop-context';

type ShopSwitcherProps = {
  shops: SessionShop[];
  currentShopId: string | null;
};

export function ShopSwitcher({ shops, currentShopId }: ShopSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlShopId = searchParams.get('shopId');
  const resolvedShopId = resolveCurrentShopId({ urlShopId, session: { user: { id: '', email: '', name: '', role: 'viewer', permissions: [] }, tenant: { id: '' }, shops, currentShopId } });
  const [selectedShopId, setSelectedShopId] = useState(resolvedShopId ?? '');

  useEffect(() => {
    setSelectedShopId(resolvedShopId ?? '');
  }, [resolvedShopId]);

  if (shops.length === 0) {
    return <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">Chưa có shop</div>;
  }

  async function handleChange(shopId: string) {
    setSelectedShopId(shopId);
    await apiFetch('/v1/me/current-shop', { method: 'PUT', body: JSON.stringify({ shopId }) });
    const params = new URLSearchParams(searchParams.toString());
    params.set('shopId', shopId);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  return (
    <label className="flex min-h-11 items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-warm-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Cửa hàng</span>
      {shops.length === 1 ? <span className="text-sm font-semibold text-ink">{shops[0]!.name}</span> : <select className="bg-transparent text-sm font-semibold text-ink outline-none" value={selectedShopId} onChange={event => void handleChange(event.target.value)}>
        {shops.map(shop => (
          <option key={shop.id} value={shop.id}>{shop.name}</option>
        ))}
      </select>}
    </label>
  );
}
