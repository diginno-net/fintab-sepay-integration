import type { Role } from './auth-context.js';

export const permissions = [
  'tenant:read',
  'tenant:write',
  'tenant_shop:read',
  'tenant_shop:write',
  'integration:read',
  'integration:write',
  'orders:read',
  'products:read',
  'products:import',
  'invoice:preview',
  'invoice:create',
  'invoice:issue',
  'invoice:download',
  'jobs:read',
  'jobs:retry',
  'webhook:configure',
  'webhook:read',
  'audit:read'
] as const;

export type Permission = (typeof permissions)[number];

const rolePermissions: Record<Role, Permission[]> = {
  owner: [...permissions],
  admin: permissions.filter(permission => permission !== 'tenant:write'),
  accountant: ['tenant:read', 'tenant_shop:read', 'integration:read', 'orders:read', 'products:read', 'invoice:preview', 'invoice:create', 'invoice:issue', 'invoice:download', 'jobs:read'],
  operator: ['tenant:read', 'tenant_shop:read', 'orders:read', 'products:read', 'invoice:preview', 'jobs:read'],
  viewer: ['tenant:read', 'tenant_shop:read', 'orders:read', 'products:read', 'jobs:read']
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}
