export type ShopAccessLevel = 'owner' | 'admin' | 'member' | 'viewer';

export type ShopAction =
  | 'shop:read'
  | 'shop:configure'
  | 'orders:read'
  | 'orders:sync'
  | 'products:read'
  | 'products:write'
  | 'invoice:read'
  | 'invoice:create'
  | 'invoice:issue'
  | 'invoice:download'
  | 'jobs:read'
  | 'jobs:retry'
  | 'tax:read'
  | 'tax:write'
  | 'integration:read'
  | 'integration:write'
  | 'audit:read';

const readActions: ShopAction[] = [
  'shop:read',
  'orders:read',
  'products:read',
  'invoice:read',
  'jobs:read',
  'tax:read',
  'integration:read',
  'audit:read'
];

const memberActions: ShopAction[] = [
  ...readActions,
  'invoice:create',
  'invoice:issue',
  'invoice:download'
];

const adminActions: ShopAction[] = [
  ...memberActions,
  'shop:configure',
  'orders:sync',
  'products:write',
  'jobs:retry',
  'tax:write',
  'integration:write'
];

export const shopAccessPolicy: Record<ShopAccessLevel, Set<ShopAction>> = {
  viewer: new Set(readActions),
  member: new Set(memberActions),
  admin: new Set(adminActions),
  owner: new Set(adminActions)
};

export function hasShopAction(accessLevel: ShopAccessLevel, action: ShopAction): boolean {
  return shopAccessPolicy[accessLevel].has(action);
}
