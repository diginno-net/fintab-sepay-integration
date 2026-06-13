'use client';

import { useEffect, useState, useTransition } from 'react';
import type { SessionShop } from '@/features/auth/session';
import { ApiClientError } from '@/lib/api/client';
import { Button } from '@/components/forms/button';
import { listShopAccessUsersClient, updateUserShopAccessClient, type ShopAccessLevel, type ShopAccessUser } from './shop-access-client';

const accessLevelLabels: Record<ShopAccessLevel, string> = {
  owner: 'Chủ shop',
  admin: 'Quản trị shop',
  member: 'Thành viên',
  viewer: 'Chỉ xem'
};

const accessLevels: ShopAccessLevel[] = ['owner', 'admin', 'member', 'viewer'];

export function ShopAccessTable({ shops }: { shops: SessionShop[] }) {
  const [users, setUsers] = useState<ShopAccessUser[]>([]);
  const [editingUser, setEditingUser] = useState<ShopAccessUser | null>(null);
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [shopAccessLevels, setShopAccessLevels] = useState<Record<string, ShopAccessLevel>>({});
  const [defaultShopId, setDefaultShopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setError(null);
    try {
      setUsers(await listShopAccessUsersClient());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Không tải được phân quyền shop.');
    }
  }

  useEffect(() => { void load(); }, []);

  function startEdit(user: ShopAccessUser) {
    const assigned = user.shops.map(shop => shop.id);
    const levels = Object.fromEntries(user.shops.map(shop => [shop.id, normalizeAccessLevel(shop.accessLevel)]));
    setEditingUser(user);
    setSelectedShopIds(assigned);
    setShopAccessLevels(levels);
    setDefaultShopId(user.shops.find(shop => shop.isDefault)?.id ?? assigned[0] ?? null);
    setMessage(null);
    setError(null);
  }

  function toggleShop(shopId: string, checked: boolean) {
    setSelectedShopIds(current => {
      const next = checked ? Array.from(new Set([...current, shopId])) : current.filter(id => id !== shopId);
      if (!next.includes(defaultShopId ?? '')) setDefaultShopId(next[0] ?? null);
      if (checked) setShopAccessLevels(levels => ({ ...levels, [shopId]: levels[shopId] ?? 'member' }));
      return next;
    });
  }

  function setAccessLevel(shopId: string, accessLevel: ShopAccessLevel) {
    setShopAccessLevels(current => ({ ...current, [shopId]: accessLevel }));
  }

  function save() {
    if (!editingUser) return;
    startTransition(async () => {
      try {
        await updateUserShopAccessClient(editingUser.user_id, {
          shops: selectedShopIds.map(shopId => ({ shopId, accessLevel: shopAccessLevels[shopId] ?? 'member' })),
          defaultShopId
        });
        setMessage(`Đã cập nhật phân quyền cho ${editingUser.email}.`);
        setEditingUser(null);
        await load();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Không cập nhật được phân quyền shop.');
      }
    });
  }

  return (
    <div className="space-y-5">
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="overflow-hidden rounded-2xl border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Cửa hàng được quyền</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {users.map(user => (
              <tr key={user.user_id}>
                <td className="px-4 py-3"><p className="font-semibold text-zinc-950">{user.name}</p><p className="text-xs text-zinc-500">{user.email}</p></td>
                <td className="px-4 py-3 text-zinc-600">{user.role}</td>
                <td className="px-4 py-3 text-zinc-700">{user.shops.length ? user.shops.map(shop => `${shop.name} · ${accessLevelLabels[normalizeAccessLevel(shop.accessLevel)]}${shop.isDefault ? ' · mặc định' : ''}`).join(', ') : 'Chưa gán cửa hàng'}</td>
                <td className="px-4 py-3 text-right"><Button type="button" variant="secondary" size="sm" onClick={() => startEdit(user)}>Sửa</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser ? (
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-zinc-950">Cập nhật cửa hàng cho {editingUser.email}</p>
            <p className="text-xs text-zinc-500">Chọn cửa hàng, cấp quyền và cửa hàng mặc định khi đăng nhập.</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {shops.map(shop => {
              const checked = selectedShopIds.includes(shop.id);
              return (
                <div key={shop.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <input type="checkbox" checked={checked} onChange={event => toggleShop(shop.id, event.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700" />
                    {shop.name}
                  </label>
                  <label className="mt-3 block text-xs font-medium text-zinc-600">
                    Cấp quyền
                    <select
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!checked}
                      value={shopAccessLevels[shop.id] ?? 'member'}
                      onChange={event => setAccessLevel(shop.id, event.target.value as ShopAccessLevel)}
                    >
                      {accessLevels.map(level => <option key={level} value={level}>{accessLevelLabels[level]}</option>)}
                    </select>
                  </label>
                  <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                    <input type="radio" name="defaultShop" disabled={!checked} checked={defaultShopId === shop.id} onChange={() => setDefaultShopId(shop.id)} />
                    Cửa hàng mặc định
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex gap-2">
            <Button type="button" onClick={save} disabled={isPending}>Lưu phân quyền</Button>
            <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} disabled={isPending}>Hủy</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function normalizeAccessLevel(value: string): ShopAccessLevel {
  return value === 'owner' || value === 'admin' || value === 'member' || value === 'viewer' ? value : 'member';
}
