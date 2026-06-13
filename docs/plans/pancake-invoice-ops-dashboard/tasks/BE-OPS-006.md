# Task: BE-OPS-006 - Implement order-level issue workflow

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-OPS-005

## Files to Modify
- `backend/src/modules/invoices/invoice-workflow.service.ts`
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Add an order-level issue endpoint that finds the current draft job for an order and enqueues issue through existing guarded issue logic.

## Requirements
- Add workflow function for issuing by tenant/shop/order.
- Find invoice job for the order.
- Require draft-created state through existing state machine/issue service.
- Call existing `enqueueIssueJob` so draft freshness and company guards are not bypassed.
- Add route `POST /v1/invoice-orders/:shopId/:orderId/issue`.
- Return invoice job and background job IDs.

## Verification
```bash
cd backend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
