# FE-PREV-004: Thêm Embedded PDF Viewer

## Status
pending

## Description
Thêm embedded PDF viewer option vào InvoiceJobDetail - sử dụng iframe hoặc react-pdf để hiển thị PDF inline thay vì chỉ download.

## Files
- `frontend/features/invoices/invoice-job-detail.tsx` (modify)

## Acceptance Criteria
- [ ] "View PDF" button → opens embedded PDF viewer
- [ ] iframe với PDF URL hoặc react-pdf component
- [ ] Fallback: nếu cross-origin hoặc PDF not ready → show download button
- [ ] TypeScript strict, no any

## Dependencies
FE-PREV-003

## Estimate
1.5h
