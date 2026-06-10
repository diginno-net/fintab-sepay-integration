# FE-INV-006: Tạo InvoicePreviewModal

## Status
pending

## Description
Tạo InvoicePreviewModal - modal preview thay thế cho việc navigate đến /invoices/preview page. Hiển thị preview summary trong modal, cho phép create draft trực tiếp.

## Files
- `frontend/features/invoices/invoice-preview-modal.tsx` (create)

## Acceptance Criteria
- [ ] Modal component (overlay + panel)
- [ ] Shop picker dropdown
- [ ] OrderPicker component
- [ ] Invoice type selector
- [ ] Preview button → call /v1/invoices/preview
- [ ] InvoicePreviewSummary display
- [ ] Create Draft button → call /v1/invoices/create-draft
- [ ] Close modal on success or cancel
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-002, FE-INV-005, FE-UI-004

## Estimate
2h
