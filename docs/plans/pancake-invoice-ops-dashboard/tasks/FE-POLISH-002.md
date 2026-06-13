# Task: FE-POLISH-002 - Replace webhook placeholder page

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: BE-AUTO-001

## Files to Modify
- `frontend/app/(platform)/shops/[shopId]/settings/webhook/page.tsx`

## Description
Replace the current webhook placeholder with a useful configuration/status page connected to available backend config where feasible.

## Requirements
- Show webhook purpose and URL instructions.
- Show current automation-relevant flags when available.
- Link to SePay/automation settings.
- Show warning that webhook auto flow follows automation policy.
- Remove placeholder text.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
