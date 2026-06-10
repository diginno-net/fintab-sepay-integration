# FE-ORD-003: Tạo OrderInvoicePanel

## Status
pending

## Description
Tạo OrderInvoicePanel - invoice panel component cho order detail page. Hiển thị tất cả invoices liên quan đến order và cho phép tạo invoice mới.

## Files
- `frontend/features/orders/order-invoice-panel.tsx` (create)

## Acceptance Criteria
- [ ] List all invoices for this order
- [ ] Invoice status badge, reference code, invoice number
- [ ] Actions: View, Download PDF, Retry (nếu failed)
- [ ] "Create Invoice" button → mở InvoicePreviewModal
- [ ] TypeScript strict, no any

## Dependencies
FE-PREV-001

## Estimate
2h
