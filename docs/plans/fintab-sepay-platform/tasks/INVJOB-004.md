# Task: INVJOB-004 - Implement retry/check/download APIs

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: INVJOB-003

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.*` MODIFY
- `backend/src/modules/jobs/jobs.routes.*` MODIFY

## Description
Implement operational invoice job actions for retry, manual check status and PDF/XML download.

## Requirements
- Retry failed/timeout jobs with idempotency guard.
- Manual check status calls the appropriate SePay check endpoint.
- Download PDF/XML using SePay download endpoint.
- Return file metadata or base64 response according to backend API design.
- Mask provider error details.

## Verification
```bash
npm --prefix backend test -- invoice-ops
```

## Notes
- Do not store fake PDF/XML URLs when provider returns base64.
