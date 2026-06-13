# Task: BE-OPS-005 - Implement order-level create draft workflow

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-OPS-004

## Files to Modify
- `backend/src/modules/invoices/invoice-workflow.service.ts` (CREATE)
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Add an order-level workflow endpoint for creating a draft invoice without the frontend needing to construct preview payloads or know job internals.

## Requirements
- Add shared workflow function for create draft by tenant/shop/order.
- Reuse existing `createInvoicePreview` behavior.
- Validate invoice request readiness before draft creation.
- Validate company payload/request consistency.
- Call existing `createOrReuseDraftJob`.
- Add route `POST /v1/invoice-orders/:shopId/:orderId/create-draft`.
- Return invoice job and background job IDs.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- This endpoint is for row actions in the new Invoice Ops UI.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
