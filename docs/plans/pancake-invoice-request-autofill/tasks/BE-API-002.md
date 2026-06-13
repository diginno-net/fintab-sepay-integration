# Task: BE-API-002 - Update PUT route normalize/validate

## Metadata
- Status: completed
- Estimate: 40m
- Depends on: BE-REQ-004, BE-API-001

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Update invoice request PUT route to normalize, validate, and then upsert request data.

## Requirements
- Block edits when related invoice job is issued or actively issuing.
- Normalize request input before save.
- Validate request input before save.
- Upsert normalized data.
- Return saved response with `source: saved`.
- Preserve permission requirement `invoice:create`.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Follow Shichida `post_sepaySaveInvoiceRequest` flow conceptually.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
