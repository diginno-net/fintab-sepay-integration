# Task: BE-REQ-001 - Fix SQL camelCase mapping

## Metadata
- Status: completed
- Estimate: 25m
- Depends on: none

## Files to Modify
- `backend/src/modules/invoices/invoice-buyer-request.service.ts`

## Description
Fix mapping mismatch between PostgreSQL snake_case columns and TypeScript camelCase request fields.

## Requirements
- Update read query result aliases so returned object exposes camelCase properties.
- Update upsert returning fields with the same camelCase aliases.
- Preserve existing database column names.
- Do not change table schema.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Current code selects fields such as `buyer_type` while UI and mapper expect `buyerType`.
- This task is prerequisite for all request behavior.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
