# Task: FE-OPS-007 - Replace /invoices page with Invoice Ops UI

## Metadata
- Status: completed
- Estimate: 1h
- Depends on: FE-OPS-005, FE-OPS-006

## Files to Modify
- `frontend/app/(platform)/invoices/page.tsx`
- `frontend/features/invoice-ops/invoice-ops-client.tsx` (CREATE)

## Description
Replace the current job-centered invoices page with the new order-centered invoice operations page.

## Requirements
- Page loads current shop from session or query param.
- Fetch invoice order rows via new API.
- Render stats, filters, table, row actions, and invoice request panel.
- Preserve route `/invoices`.
- Keep link/path to old job details through row actions where useful.
- Current job list should move conceptually to `/jobs` as technical log.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
