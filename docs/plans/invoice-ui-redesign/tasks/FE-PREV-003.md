# FE-PREV-003: Thêm Timeline Visualization vào InvoiceJobDetail

## Status
pending

## Description
Thêm timeline visualization cho InvoiceJobDetail hiển thị job state transitions: pending → draft_create_queued → draft_create_running → draft_create_polling → draft_created → issue_queued → issue_running → issue_polling → issued.

## Files
- `frontend/features/invoices/invoice-job-detail.tsx` (modify)

## Acceptance Criteria
- [ ] Visual timeline với các bước
- [ ] Current step highlighted
- [ ] Completed steps có checkmark
- [ ] Failed/error step có X mark
- [ ] Timestamps cho mỗi transition
- [ ] TypeScript strict, no any

## Dependencies
None

## Estimate
2h
