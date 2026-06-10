# FE-INV-004: Redesign /invoices Page

## Status
pending

## Description
Redesign hoàn toàn /invoices page theo mẫu: Header "Quản lý hóa đơn điện tử", Stats bar, Tabs status, Filters, Table. Kết hợp InvoiceStatsBar, InvoiceFilters, DataTable, InvoiceTableRow.

## Files
- `frontend/app/(platform)/invoices/page.tsx` (modify)

## Acceptance Criteria
- [ ] Header: "Quản lý hóa đơn điện tử"
- [ ] InvoiceStatsBar ngay dưới header
- [ ] InvoiceFilters với Tabs
- [ ] DataTable với InvoiceTableRow
- [ ] Pagination
- [ ] Bulk actions (select all, retry selected)
- [ ] "Tạo hóa đơn" button điều hướng đến preview
- [ ] Server-side data fetching
- [ ] TypeScript strict, no any

## Dependencies
FE-INV-001, FE-INV-002, FE-INV-003

## Estimate
3h
