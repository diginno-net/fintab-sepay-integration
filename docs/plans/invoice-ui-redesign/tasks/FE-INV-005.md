# FE-INV-005: Mở rộng API cho Invoice List

## Status
pending

## Description
Mở rộng features/invoices/api.ts thêm functions cho invoice list với filters và stats aggregation.

## Files
- `frontend/features/invoices/api.ts` (modify)

## Acceptance Criteria
- [ ] Thêm getInvoiceStats(shopId?) - trả về counts theo status
- [ ] Thêm listInvoices({ shopId?, status?, dateFrom?, dateTo?, search?, page?, limit? }) - paginated, filterable
- [ ] Update listInvoiceJobs để hỗ trợ filter theo status
- [ ] TypeScript strict, no any

## Dependencies
None (backend đã có endpoint)

## Estimate
2h
