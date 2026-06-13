# Task: BE-INV-004 - Add draft/create validation before enqueue

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-INV-003

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.ts`
- `backend/src/modules/invoices/invoice-validation.ts`

## Description
Validate invoice request readiness before creating or reusing a draft job.

## Requirements
- Require confirmed invoice request before draft creation.
- Require email before draft creation.
- Require payment method, template code, and invoice series.
- Require company fields for company invoices.
- Return user-friendly validation errors.
- Avoid enqueueing draft job when request is not ready.

## Verification
```bash
cd backend && npm run typecheck
```

## Manual Check
```text
Attempt create draft without confirmed request returns validation error.
Attempt create company draft without MST returns validation error.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
