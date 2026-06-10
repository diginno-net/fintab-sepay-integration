# FE-ORD-002: Thêm Invoice Status Column vào Orders Table

## Status
pending

## Description
Thêm invoice status column vào orders table trong /orders page. Sử dụng OrderInvoiceActions.

## Files
- `frontend/app/(platform)/orders/page.tsx` (modify)

## Acceptance Criteria
- [ ] Thêm column "Hóa đơn" vào orders table
- [ ] Sử dụng OrderInvoiceActions component
- [ ] Cần fetch invoice job status cho mỗi order (hoặc batch)
- [ ] TypeScript strict, no any

## Dependencies
FE-ORD-001

## Estimate
2h
