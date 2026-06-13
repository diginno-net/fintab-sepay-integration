# Task: FE-POLISH-003 - Make shop switcher update URL/session behavior

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: FE-OPS-007

## Files to Modify
- `frontend/features/shop-switcher/shop-switcher.tsx`
- Related page components only if needed

## Description
Make the top-level shop switcher actually affect current page data instead of only changing local state.

## Requirements
- On shop change, update URL query `shopId` or call existing current-shop session update if available.
- Preserve current path and compatible query params.
- Ensure `/invoices` reloads data for selected shop.
- Avoid breaking pages that already accept `shopId` query.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
