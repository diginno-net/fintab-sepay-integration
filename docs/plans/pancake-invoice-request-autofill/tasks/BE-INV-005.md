# Task: BE-INV-005 - Add issue guard for outdated/wrong company

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-INV-004

## Files to Modify
- `backend/src/modules/invoices/invoice-job.service.ts`
- `backend/src/modules/invoices/invoice-request-rules.ts`

## Description
Block issue when the saved invoice request changed after draft creation or when company request does not match draft payload.

## Requirements
- Compare current invoice request hash with draft snapshot hash.
- Return `requiresDraftRecreate` when hash differs.
- Detect company request with personal or incomplete company draft payload.
- Block issue before enqueueing issue job.
- Keep existing issue state machine behavior.

## Verification
```bash
cd backend && npm run typecheck
```

## Manual Check
```text
Create draft, edit invoice request, then issue should be blocked.
Company request with personal draft should be blocked.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
