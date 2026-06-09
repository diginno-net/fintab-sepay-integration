'use client';

import { useState } from 'react';
import type { SessionShop } from '@/features/auth/session';

type ShopSwitcherProps = {
  shops: SessionShop[];
  currentShopId: string | null;
};

export function ShopSwitcher({ shops, currentShopId }: ShopSwitcherProps) {
  const [selectedShopId, setSelectedShopId] = useState(currentShopId ?? shops[0]?.id ?? '');

  if (shops.length === 0) {
    return <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">Chưa có shop</div>;
  }

  return (
    <label className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Shop</span>
      <select className="bg-transparent text-sm font-semibold text-zinc-950 outline-none" value={selectedShopId} onChange={event => setSelectedShopId(event.target.value)}>
        {shops.map(shop => (
          <option key={shop.id} value={shop.id}>{shop.name}</option>
        ))}
      </select>
    </label>
  );
}
