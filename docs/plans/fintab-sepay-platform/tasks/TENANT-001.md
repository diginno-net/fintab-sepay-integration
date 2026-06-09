# Task: TENANT-001 - Implement tenant and shop context

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: AUTH-001

## Files to Modify
- `backend/src/modules/tenant/*` CREATE
- `backend/src/shared/tenant/*` CREATE

## Description
Implement tenant context, tenant shop management, shop access guardrails, and per-shop data isolation.

## Requirements
- Tenant context middleware: attaches tenantId from session to request
- Tenant shop CRUD/service baseline
- Validate user membership before accessing tenant data
- Validate `tenant_shop_id` belongs to current tenant (STRICT enforcement)
- Never trust tenant_id from client body
- Shop-level data isolation: all queries MUST include tenant_shop_id scope
- Tenant A CANNOT access tenant B's shops, configs, invoices, or jobs

## Shop Context Flow

```
1. User calls GET /v1/me -> gets shops[]
2. User selects shop (or first shop auto-selected) -> frontend stores currentShopId
3. All subsequent API calls use currentShopId from frontend context OR from route
4. Backend ALWAYS validates: currentShopId belongs to current user's tenant
5. All DB queries for orders/invoices/jobs include tenant_shop_id filter
```

## Strict Isolation Rules

```
tenant_shops:
  SELECT WHERE tenant_id = req.user.tenantId

invoice_jobs:
  SELECT WHERE tenant_id = req.user.tenantId AND tenant_shop_id = currentShopId

integration_configs:
  SELECT WHERE tenant_id = req.user.tenantId AND tenant_shop_id = currentShopId

webhook_inbox:
  SELECT WHERE tenant_id = req.user.tenantId AND tenant_shop_id = currentShopId
```

## Verification
```bash
npm --prefix backend test -- tenant
```

## Notes
- This task owns tenant/shop boundaries used by all later modules.
- All later modules depend on this for correct scoping.