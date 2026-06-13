# Task: FE-REQ-001 - Update invoice request client types

## Metadata
- Status: completed
- Estimate: 25m
- Depends on: BE-API-001

## Files to Modify
- `frontend/features/invoices/invoice-buyer-request-client.ts`

## Description
Update frontend API types to support saved or Pancake-suggested invoice request responses.

## Requirements
- Add `source: saved | pancake` to response type.
- Allow `id` to be null for suggested responses.
- Make timestamp fields optional or nullable for suggested responses.
- Keep PUT input type unchanged unless backend schema requires a safe addition.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
