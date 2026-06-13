import { apiFetch } from '@/lib/api/client';
import { cookies } from 'next/headers';

export type UserRole = 'owner' | 'admin' | 'accountant' | 'operator' | 'viewer';

export type SessionShop = {
  id: string;
  name: string;
  status: string;
  accessLevel: 'owner' | 'admin' | 'member' | 'viewer';
  isDefault: boolean;
  hasPancakeConfig: boolean;
  hasSepayConfig: boolean;
};

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: string[];
  };
  tenant: {
    id: string;
    name?: string;
  };
  shops: SessionShop[];
  currentShopId: string | null;
};

export async function getCurrentSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const session = await apiFetch<Session>('/v1/me', {
      cache: 'no-store',
      headers: { cookie: cookieHeader }
    });
    return {
      ...session,
      shops: session.shops.map(shop => ({
        ...shop,
        accessLevel: shop.accessLevel ?? (shop as unknown as { access_level?: SessionShop['accessLevel'] }).access_level ?? 'viewer',
        isDefault: shop.isDefault ?? (shop as unknown as { is_default?: boolean }).is_default ?? false,
        hasPancakeConfig: shop.hasPancakeConfig ?? (shop as unknown as { has_pancake_config?: boolean }).has_pancake_config ?? false,
        hasSepayConfig: shop.hasSepayConfig ?? (shop as unknown as { has_sepay_config?: boolean }).has_sepay_config ?? false
      }))
    };
  } catch {
    return null;
  }
}

export function can(session: Session | null, permission: string): boolean {
  return Boolean(session?.user.permissions.includes(permission));
}
