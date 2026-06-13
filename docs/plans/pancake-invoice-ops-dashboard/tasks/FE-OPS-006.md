# Task: FE-OPS-006 - Build invoice request panel

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: FE-OPS-004

## Files to Modify
- `frontend/features/invoice-ops/invoice-request-panel.tsx` (CREATE)

## Description
Add an inline panel, drawer, or modal for editing invoice request information directly from the invoice operations table.

## Requirements
- Reuse existing `InvoiceRequestForm`.
- Open from row action `Thông tin HĐ`.
- Pass shopId and orderId.
- Refresh invoice order row/list after successful save.
- Display saved/suggested/dirty behavior from existing form.
- Avoid navigating away from `/invoices`.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
