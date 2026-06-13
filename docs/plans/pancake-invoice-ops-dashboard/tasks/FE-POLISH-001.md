# Task: FE-POLISH-001 - Reposition Jobs page as technical log

## Metadata
- Status: pending
- Estimate: 30m
- Depends on: FE-OPS-007

## Files to Modify
- `frontend/app/(platform)/jobs/page.tsx`
- `frontend/components/navigation/main-nav.tsx` (optional)

## Description
Adjust copy/navigation so Jobs is clearly a technical processing log, not the primary invoice operations page.

## Requirements
- Rename user-facing copy to “Nhật ký xử lý nền” or equivalent.
- Make page description explain background jobs, retry, and debug status.
- Ensure primary invoice operations CTA points to `/invoices`.
- Do not remove existing job detail functionality.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
