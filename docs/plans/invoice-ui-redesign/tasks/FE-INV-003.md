# FE-INV-003: Tạo InvoiceTableRow Component

## Status
pending

## Description
Tạo InvoiceTableRow - single row component cho invoice table với inline actions. Columns: checkbox, Đơn (order ID), Khách hàng, Mã SePay, Mã hóa đơn, Trạng thái, Luồng xử lý, Cập nhật, Lỗi, Thao tác.

## Files
- `frontend/features/invoices/invoice-table-row.tsx` (create)

## Acceptance Criteria
- [ ] Columns: order_id, customer_name, sepay_tracking_code, invoice_number, status badge, flow indicator, updated_at, error, actions
- [ ] Status badge với đúng màu
- [ ] Actions: View, Retry, Download PDF (icon buttons, size sm)
- [ ] Row hover state
- [ ] Expandable để show thêm details
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-003, FE-UI-005

## Estimate
1.5h
