# Task: TENANT-001 - Add tenant isolation tests for core resources

## Metadata
- Status: pending
- Estimate: 1h
- Depends on: SEC-003

## Files to Modify
- `backend/tests/tenant-isolation.test.ts` (MODIFY)
- Additional backend test files if needed (CREATE/MODIFY)

## Description
Expand tenant and shop isolation test coverage beyond tenant shops.

## Requirements
- Tenant B cannot access Tenant A invoice job.
- Tenant B cannot retry Tenant A background job.
- Tenant B cannot read Tenant A product.
- Tenant B cannot read Tenant A integration config.
- Tenant B cannot read Tenant A audit logs.
- User without shop access cannot create or issue invoice for that shop.

## Verification
```bash
npm --prefix backend test -- tenant
npm --prefix backend run typecheck
```

## Notes
- This task should first add tests and identify failures; do not over-refactor unless small fixes are obvious and safe.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
