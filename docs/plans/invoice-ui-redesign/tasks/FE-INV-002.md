# FE-INV-002: Tạo InvoiceFilters Component

## Status
pending

## Description
Tạo InvoiceFilters - filter bar cho invoice page với: shop dropdown, date range, search by reference/invoice number. Sử dụng Tabs cho status filter.

## Files
- `frontend/features/invoices/invoice-filters.tsx` (create)

## Acceptance Criteria
- [ ] Shop dropdown (searchable)
- [ ] Date range picker (from/to)
- [ ] Search input (reference code, invoice number)
- [ ] Tabs cho status: Tất cả / Chưa tạo / Đã tạo nháp / Đã phát hành / Lỗi
- [ ] On change triggers filter update
- [ ] Clear filters button
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-002, FE-UI-003

## Estimate
1.5h
