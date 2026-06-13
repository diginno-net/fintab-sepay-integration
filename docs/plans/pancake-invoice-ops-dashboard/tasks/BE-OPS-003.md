# Task: BE-OPS-003 - Implement invoice order read service

## Metadata
- Status: completed
- Estimate: 1h
- Depends on: BE-OPS-002

## Files to Modify
- `backend/src/modules/invoices/invoice-order-read.service.ts` (CREATE)

## Description
Implement the backend read model that powers the Shichida-like invoice operations dashboard.

## Requirements
- Fetch Pancake orders for a shop using existing Pancake client/service conventions.
- Extract order rows using existing normalization helpers where possible.
- Batch-load invoice jobs and invoice buyer requests for the fetched order IDs.
- Merge order, job, and buyer request into `InvoiceOrderRow` objects.
- Compute row status and eligibility using `invoice-order-status.ts`.
- Compute stats from returned rows.
- Support filters: status, search, limit.
- Avoid N+1 database queries.

## Interface Definitions
```text
listInvoiceOrderRows(input):
- tenantId
- shopId
- status?
- search?
- limit?

returns:
- stats
- rows
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- This service builds a realtime read model; do not introduce a projection table in this task.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
