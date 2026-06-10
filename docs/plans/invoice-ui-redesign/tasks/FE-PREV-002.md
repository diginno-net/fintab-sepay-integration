# FE-PREV-002: Cải thiện InvoicePreviewSummary

## Status
pending

## Description
Cải thiện layout của InvoicePreviewSummary - display sections tốt hơn, inline edit capability cho buyer info và tax rates.

## Files
- `frontend/features/invoice-preview/invoice-preview-summary.tsx` (modify)

## Acceptance Criteria
- [ ] Better card layout: Buyer info card, Invoice info card
- [ ] Items table với inline tax rate editing
- [ ] Blocking warning banner (red) if TAX_MAPPING_BLOCKED
- [ ] Warnings list với badges (red for blocking, amber for non-blocking)
- [ ] TypeScript strict, no any

## Dependencies
FE-PREV-001

## Estimate
2h
