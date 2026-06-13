import type { Session, SessionShop } from '@/features/auth/session';

export function resolveCurrentShopId(input: { urlShopId?: string | null; session: Session | null }): string | null {
  const shops = input.session?.shops ?? [];
  if (input.urlShopId && hasShop(shops, input.urlShopId)) return input.urlShopId;
  if (input.session?.currentShopId && hasShop(shops, input.session.currentShopId)) return input.session.currentShopId;
  return shops[0]?.id ?? null;
}

export function withShopId(path: string, shopId: string | null): string {
  if (!shopId) return path;
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('shopId', shopId);
  return `${pathname}?${params.toString()}`;
}

function hasShop(shops: SessionShop[], shopId: string): boolean {
  return shops.some(shop => shop.id === shopId);
}
