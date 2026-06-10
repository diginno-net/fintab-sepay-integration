# FE-LOG-001: Tạo InvoiceLogTable

## Status
pending

## Description
Tạo InvoiceLogTable - log-style invoice table theo màn 3. Columns: Đơn, Trạng thái, Hóa đơn, Mã SePay, Luồng xử lý, Cập nhật, Lỗi, Thao tác.

## Files
- `frontend/features/invoices/invoice-log-table.tsx` (create)

## Acceptance Criteria
- [ ] Columns: order_id, status badge, invoice_number, sepay_reference_code, flow (timeline icon), updated_at, error message, actions dropdown
- [ ] Actions: Tải PDF, Tải XML, Retry, Xem payload
- [ ] Expandable row cho payload/response JSON
- [ ] Sử dụng DataTable component
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-003

## Estimate
2.5h
