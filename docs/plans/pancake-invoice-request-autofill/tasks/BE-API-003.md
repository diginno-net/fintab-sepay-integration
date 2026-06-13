# Task: BE-API-003 - Enrich draft-status response

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: BE-API-002

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Enhance draft-status endpoint so UI can display recreate/outdated warnings clearly.

## Requirements
- Return whether draft exists.
- Return whether draft is outdated.
- Return whether draft requires recreation.
- Return a user-friendly draft outdated message.
- Return wrong-company-draft signal if detectable.
- Preserve existing `draftStatus` and `invoiceJobId` fields.

## Interface Definitions
```text
DraftStatus:
- hasDraft
- outdated
- requiresDraftRecreate
- wrongCompanyDraft
- draftOutdatedMessage
- draftStatus
- invoiceJobId
```

## Verification
```bash
cd backend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
