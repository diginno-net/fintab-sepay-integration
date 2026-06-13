# Task: FE-FORM-003 - Add company/personal helper messages

## Metadata
- Status: completed
- Estimate: 30m
- Depends on: FE-FORM-002

## Files to Modify
- `frontend/features/invoice-preview/invoice-request-form.tsx`

## Description
Improve helper messages for company and personal invoice request modes.

## Requirements
- Show MST required warning for company mode when missing.
- Show company name/address required hints for company mode when missing.
- Keep identity number field visible only for personal mode.
- Ensure personal mode does not visually imply MST is required.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
