# Task: FE-FORM-005 - Save updates badge and dirty state

## Metadata
- Status: completed
- Estimate: 25m
- Depends on: FE-FORM-004

## Files to Modify
- `frontend/features/invoice-preview/invoice-request-form.tsx`

## Description
After saving invoice request data, update UI source state and dirty state consistently.

## Requirements
- On save success, set source to saved.
- On save success, clear dirty state.
- Preserve success message.
- Continue to call `onSaved` with response data.
- Handle save validation errors without clearing dirty state.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
