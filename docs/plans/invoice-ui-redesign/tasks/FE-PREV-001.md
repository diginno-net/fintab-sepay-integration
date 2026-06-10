# FE-PREV-001: Redesign InvoicePreviewForm

## Status
pending

## Description
Redesign InvoicePreviewForm với OrderPicker thay vì text input, ShopPicker dropdown, và inline tax editing option.

## Files
- `frontend/features/invoice-preview/invoice-preview-form.tsx` (modify)

## Acceptance Criteria
- [ ] Thay orderId text input bằng OrderPicker
- [ ] Thay shopId text input bằng ShopPicker dropdown
- [ ] Invoice type toggle (GTGT / Ban Hang)
- [ ] Preview button → call /v1/invoices/preview
- [ ] Create Draft button → call /v1/invoices/create-draft
- [ ] Show InvoicePreviewSummary sau preview
- [ ] Toggle raw JSON vs formatted summary
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-004

## Estimate
3h
