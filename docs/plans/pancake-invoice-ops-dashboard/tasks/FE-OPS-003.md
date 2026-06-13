# Task: FE-OPS-003 - Build invoice order filters/search component

## Metadata
- Status: completed
- Estimate: 40m
- Depends on: FE-OPS-001

## Files to Modify
- `frontend/features/invoice-ops/invoice-order-filters.tsx` (CREATE)

## Description
Build tabs and search controls for filtering invoice operation rows.

## Requirements
- Tabs: all, not_created, draft_created, issued, failed, requires_attention.
- Search by order code, customer name, email, invoice number where backend supports it.
- Preserve query params in URL so refresh/back works.
- Show counts if available from stats.
- Use accessible buttons/inputs with focus states.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
