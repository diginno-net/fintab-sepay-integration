# Task: BE-OPS-004 - Add GET /v1/invoice-orders

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-OPS-003

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Expose the invoice order read model through an authenticated API endpoint for the new `/invoices` UI.

## Requirements
- Add `GET /v1/invoice-orders`.
- Require invoice/order read permission consistent with existing app conventions.
- Validate query parameters: shopId, status, search, limit.
- Return `{ stats, rows }` from `invoice-order-read.service.ts`.
- Return user-friendly errors when Pancake shop or SePay config is unavailable.

## Verification
```bash
cd backend && npm run typecheck
```

## Manual Check
```text
GET /v1/invoice-orders?shopId=<shopId> returns rows for recent Pancake orders and stats.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
