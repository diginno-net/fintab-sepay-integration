# Task: RBAC-001 - Implement RBAC permissions

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: TENANT-001

## Files to Modify
- `backend/src/modules/access-control/*` CREATE
- `backend/src/shared/auth/rbac-middleware.*` CREATE/MODIFY

## Description
Implement role and permission checks for tenant-scoped actions.

## Requirements
- Roles: owner, admin, accountant, operator, viewer.
- Permissions include tenant_shop, integration, orders, products, invoice, jobs, webhook, audit actions.
- Middleware blocks unauthorized access with 403.
- Permission requirement should be represented in OpenAPI metadata where practical.

## Verification
```bash
npm --prefix backend test -- rbac
```

## Notes
- Frontend guards are UX only; backend is source of truth.
