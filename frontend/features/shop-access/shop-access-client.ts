'use client';

import { apiFetch } from '@/lib/api/client';

export type ShopAccessUser = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  shops: Array<{ id: string; name: string; isDefault: boolean; accessLevel: string }>;
};

export type ShopAccessLevel = 'owner' | 'admin' | 'member' | 'viewer';

export function listShopAccessUsersClient() {
  return apiFetch<ShopAccessUser[]>('/v1/shop-access/users', { cache: 'no-store' });
}

export function updateUserShopAccessClient(userId: string, input: { shops: Array<{ shopId: string; accessLevel: ShopAccessLevel }>; defaultShopId: string | null }) {
  return apiFetch<{ ok: boolean }>(`/v1/shop-access/users/${userId}/shops`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}
