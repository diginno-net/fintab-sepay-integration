# Task: BE-REQ-003 - Add request normalize/sanitize helpers

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-REQ-002

## Files to Modify
- `backend/src/modules/invoices/invoice-request-normalizers.ts` (CREATE)

## Description
Port Shichida-style normalization helpers for invoice request data.

## Requirements
- Normalize `buyerType` to `company` or `personal`.
- Trim text fields.
- Clean email and phone fields defensively.
- Clear company-only fields when buyer is personal.
- Clear personal-only identity field when buyer is company.
- Remove known demo invoice values unless explicitly allowed.
- Preserve user-provided valid company names and legal names.

## Interface Definitions
```text
normalizeInvoiceRequestForProcessing(input): normalized input
sanitizeInvoiceRequestForDisplay(input): display-safe request
cleanInvoiceOverride(value, options): cleaned text
isDemoInvoiceValue(value): boolean
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Reference: `sepayInvoiceRequestUtils.js` in Shichida project.
- Do not include framework or database logic in this helper.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
