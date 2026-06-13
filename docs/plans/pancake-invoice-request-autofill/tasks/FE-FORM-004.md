# Task: FE-FORM-004 - Show draft outdated warning

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: FE-REQ-002, FE-FORM-002

## Files to Modify
- `frontend/features/invoice-preview/invoice-request-form.tsx`

## Description
Show warning when invoice request changes require draft recreation.

## Requirements
- Load draft status for the selected shop/order.
- Show warning when `outdated` or `requiresDraftRecreate` is true.
- Display backend-provided `draftOutdatedMessage` when available.
- Keep warning non-blocking in the form, but clear enough for user action.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
