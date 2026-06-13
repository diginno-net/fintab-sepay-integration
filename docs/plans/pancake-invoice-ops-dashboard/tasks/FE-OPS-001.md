# Task: FE-OPS-001 - Add invoice ops API client/types

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: BE-OPS-004

## Files to Modify
- `frontend/features/invoice-ops/api-client.ts` (CREATE)

## Description
Create frontend API client and TypeScript types for the new order-centered invoice operations endpoint and actions.

## Requirements
- Define `InvoiceOrderRow`, `InvoiceOrderStats`, and action result types.
- Add client function for `GET /v1/invoice-orders`.
- Add client functions for order-level create draft and issue.
- Add client functions for bulk create draft and bulk issue.
- Keep API client small and reusable by UI components.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
