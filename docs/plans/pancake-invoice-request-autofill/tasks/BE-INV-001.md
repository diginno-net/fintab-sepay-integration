# Task: BE-INV-001 - Preview uses saved/suggested request

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-API-001

## Files to Modify
- `backend/src/modules/invoices/invoice.service.ts`

## Description
Make invoice preview use the same saved-or-suggested invoice request behavior as the form.

## Requirements
- Load Pancake order once and reuse it for suggestion and payload mapping.
- Prefer saved request when present.
- Use suggested request when no saved request exists.
- Return request data in preview response so create draft snapshot remains aligned.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- This prevents form and preview from showing different buyer data.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
