# Task: BE-REQ-004 - Add invoice request validation rules

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-REQ-003

## Files to Modify
- `backend/src/modules/invoices/invoice-request-rules.ts` (CREATE)
- `backend/src/modules/invoices/invoice-validation.ts`

## Description
Add Shichida-style validation rules for saving invoice requests and checking readiness before draft/issue operations.

## Requirements
- Validate company requests require tax code, company/legal name, and invoice address.
- Validate tax code format as 10 or 13 digits and reject demo tax codes.
- Validate email format when present.
- Validate payment method values.
- Validate request readiness for draft: confirmed, email, payment method, template code, invoice series.
- Add helpers for missing company fields and payload/request mismatch.

## Interface Definitions
```text
validateInvoiceRequest(input): void
assertInvoiceRequestReadyForDraft(input, settings): void
getMissingCompanyInvoiceFields(input): string[]
assertCompanyPayloadMatchesRequest(input, payload): void
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Reference: `sepayInvoiceRules.js` in Shichida project.
- Keep messages user-friendly and in Vietnamese.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
