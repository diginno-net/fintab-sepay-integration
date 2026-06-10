# FE-PREV-005: Thêm Cancel Action và Copy Invoice Number

## Status
pending

## Description
Thêm cancel action cho queued jobs và copy invoice number button vào JobActions.

## Files
- `frontend/features/job-history/job-actions.tsx` (modify)

## Acceptance Criteria
- [ ] Cancel button cho queued jobs (POST /v1/invoices/jobs/{id}/cancel - cần backend API)
- [ ] Copy invoice number button (clipboard API) - chỉ show khi có invoice_number
- [ ] TypeScript strict, no any

## Dependencies
None

## Estimate
1h
