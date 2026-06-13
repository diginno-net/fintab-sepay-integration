# Task: FE-FORM-002 - Add source badge and dirty state

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: FE-FORM-001

## Files to Modify
- `frontend/features/invoice-preview/invoice-request-form.tsx`

## Description
Show whether the displayed request came from Pancake suggestion or saved DB data, and track unsaved changes.

## Requirements
- Show badge `Đã tự điền từ Pancake` for `source=pancake`.
- Show badge `Đã lưu thủ công` for `source=saved`.
- Set dirty state when user changes any input.
- Notify parent via existing `onChanged` callback.
- Keep loading/saved/error messages readable.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
