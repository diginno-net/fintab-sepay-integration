# Task: FE-AUTO-001 - Add automation settings form

## Metadata
- Status: completed-basic
- Estimate: 1h
- Depends on: BE-AUTO-001

## Files to Modify
- `frontend/features/sepay-config/sepay-config-form.tsx`
- `frontend/features/shops/api.ts`

## Description
Add UI controls for invoice automation policy inside the existing SePay settings form.

## Requirements
- Render toggles for dry run, auto create invoice, auto issue invoice, require confirmation before auto issue.
- Load existing policy on page load.
- Save policy to backend.
- Show strong warning when auto issue is enabled.
- Keep default recommended state conservative.

## Implementation Notes
- Implemented under [`sepay-invoice-automation-settings`](../../sepay-invoice-automation-settings/plan.md).
- The UI was added to the existing `SepayConfigForm` rather than a new `invoice-automation` feature folder.
- Default invoice type/status selectors are deferred because the implemented contract stores only the four SePay automation toggles.
- Verification passed: frontend typecheck, frontend tests, and frontend build.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
