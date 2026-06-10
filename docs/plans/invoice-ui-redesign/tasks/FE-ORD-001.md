# FE-ORD-001: Tạo OrderInvoiceActions

## Status
pending

## Description
Tạo OrderInvoiceActions - inline invoice actions component cho order list. Hiển thị invoice status badge và quick actions (Preview, Create Draft) trong mỗi row.

## Files
- `frontend/features/orders/order-invoice-actions.tsx` (create)

## Acceptance Criteria
- [ ] Props: orderId, shopId, invoiceJobStatus?
- [ ] Invoice status badge (no invoice / draft / issued / failed)
- [ ] Actions: Preview Invoice, Create Draft (button sm)
- [ ] Gọi InvoicePreviewModal khi click action
- [ ] TypeScript strict, no any

## Dependencies
FE-INV-006

## Estimate
1.5h
