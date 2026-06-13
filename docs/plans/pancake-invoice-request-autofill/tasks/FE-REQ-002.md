# Task: FE-REQ-002 - Update draft status client type

## Metadata
- Status: completed
- Estimate: 20m
- Depends on: BE-API-003

## Files to Modify
- `frontend/features/invoices/invoice-buyer-request-client.ts`

## Description
Update frontend draft status type to include recreate flags and warning message.

## Requirements
- Add `requiresDraftRecreate`.
- Add `wrongCompanyDraft`.
- Add `draftOutdatedMessage`.
- Preserve existing fields: `hasDraft`, `outdated`, `draftStatus`, `invoiceJobId`.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
