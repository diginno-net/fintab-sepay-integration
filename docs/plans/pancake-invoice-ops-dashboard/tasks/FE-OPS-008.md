# Task: FE-OPS-008 - Add bulk selection/action bar

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-OPS-008, FE-OPS-007

## Files to Modify
- `frontend/features/invoice-ops/invoice-order-table.tsx`
- `frontend/features/invoice-ops/invoice-ops-client.tsx`

## Description
Add bulk selection and bulk actions for eligible invoice rows.

## Requirements
- Allow selecting/deselecting rows.
- Show count of selected rows.
- Show bulk create draft for selected eligible rows.
- Show bulk issue for selected eligible rows.
- Disable bulk actions when no eligible selected rows.
- Show per-row result summary after bulk API response.
- Keep selection state stable across refresh where practical.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
