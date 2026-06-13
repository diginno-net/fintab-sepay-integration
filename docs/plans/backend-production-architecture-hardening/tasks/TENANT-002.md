# Task: TENANT-002 - Fix direct ID access leaks found by tests

## Metadata
- Status: pending
- Estimate: 1h
- Depends on: TENANT-001

## Files to Modify
- Relevant backend modules discovered by TENANT-001 (MODIFY)
- `backend/tests/tenant-isolation.test.ts` or related tests (MODIFY if needed)

## Description
Fix any tenant/shop isolation leaks discovered by the expanded tests.

## Requirements
- All resource reads/writes must include tenant filter.
- Shop-scoped actions must verify user shop access where appropriate.
- Direct ID access across tenants must return forbidden/not found according to existing API pattern.
- Avoid leaking existence of another tenant's resources where possible.

## Verification
```bash
npm --prefix backend test -- tenant
npm --prefix backend test
npm --prefix backend run typecheck
```

## Notes
- Keep file changes limited to modules with proven leaks.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
