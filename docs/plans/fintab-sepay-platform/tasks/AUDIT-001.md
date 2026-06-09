# Task: AUDIT-001 - Implement audit logging

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: RBAC-001

## Files to Modify
- `backend/src/modules/audit/*` CREATE

## Description
Implement audit logging for user, worker, system and webhook actions.

## Requirements
- Store actor type, actor user, tenant, shop, action, resource, metadata and correlation ID.
- Mask secrets in before/after metadata.
- Provide audit query endpoint with RBAC.
- Write audit entries for config changes and invoice operations in later tasks.

## Verification
```bash
npm --prefix backend test -- audit
```

## Notes
- Do not log raw Pancake API keys or SePay secrets.
