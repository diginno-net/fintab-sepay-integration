# Task: BE-PAN-003 - Add saved-or-suggested service helper

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-PAN-002

## Files to Modify
- `backend/src/modules/invoices/invoice-buyer-request.service.ts`

## Description
Add a service-level helper that returns saved invoice request when present, or suggested data from Pancake order otherwise.

## Requirements
- Keep existing `getInvoiceBuyerRequest` available for saved-only use cases.
- Add a new helper for saved-or-suggested behavior.
- Return `source: saved` for persisted data.
- Return `source: pancake` for suggestions.
- Require caller to pass Pancake order and SePay config where possible.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- This helper should not fetch Pancake itself; route/service orchestration should do that.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
