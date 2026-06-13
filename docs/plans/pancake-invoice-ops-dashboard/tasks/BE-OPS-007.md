# Task: BE-OPS-007 - Add bulk create draft endpoint

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-OPS-005

## Files to Modify
- `backend/src/modules/invoices/invoice-workflow.service.ts`
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Add bulk create draft operation for selected order rows.

## Requirements
- Add route `POST /v1/invoice-orders/bulk-create-draft`.
- Accept shopId and orderIds.
- Process each order through the same order-level create draft workflow.
- Return per-order result with success/skipped/failed status.
- Do not stop the whole batch when one order fails validation.
- Preserve idempotency through existing draft job logic.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Keep batch size bounded to avoid long request times.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
