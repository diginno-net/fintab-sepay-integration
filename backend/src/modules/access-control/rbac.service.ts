import type { Permission } from '../../shared/auth/permissions.js';
import type { Role } from '../../shared/auth/auth-context.js';
import { hasPermission, permissionsForRole } from '../../shared/auth/permissions.js';

export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission);
}

export function listPermissions(role: Role): Permission[] {
  return permissionsForRole(role);
}
