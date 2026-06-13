# Task: BE-OPS-008 - Add bulk issue endpoint

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-OPS-006

## Files to Modify
- `backend/src/modules/invoices/invoice-workflow.service.ts`
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Add bulk issue operation for selected draft-created order rows.

## Requirements
- Add route `POST /v1/invoice-orders/bulk-issue`.
- Accept shopId and orderIds or invoiceJobIds.
- Process each row through existing guarded issue logic.
- Return per-order result with success/skipped/failed status.
- Block rows requiring draft recreation.
- Do not bypass accountant confirmation/draft freshness/company guards.

## Verification
```bash
cd backend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
