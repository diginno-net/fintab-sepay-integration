# Task: BE-AUTO-003 - Add guarded auto-issue after draft_created

## Metadata
- Status: completed
- Estimate: 1h
- Depends on: BE-AUTO-002, BE-OPS-006

## Files to Modify
- `backend/src/modules/jobs/job-handlers.ts`
- `backend/src/modules/invoices/invoice-job.service.ts`
- `backend/src/modules/invoices/invoice-automation-policy.ts`

## Description
After a draft is successfully created, optionally enqueue issue based on automation policy while preserving all existing guards.

## Requirements
- Detect successful `draft_created` transition in job handler.
- Load automation policy for the job's shop.
- If auto issue is disabled, do nothing.
- If dry run is enabled, do not enqueue issue.
- If confirmation is required and request is not confirmed, do not enqueue issue; record/return reason where feasible.
- Call existing guarded issue workflow or `enqueueIssueJob`.
- Do not bypass draft freshness/company guard.

## Implementation Notes
- `job-handlers.ts` calls `enqueueAutoIssueIfAllowed` after draft creation succeeds.
- `enqueueAutoIssueIfAllowed` uses `evaluateAutoIssue` and then calls existing `enqueueIssueJob` with `actorUserId: null` for system automation.
- Auto-issue errors are swallowed from the create-draft handler so a successful draft creation is not turned into a failed worker execution.
- Verification passed: backend typecheck and backend unit tests.

## Verification
```bash
cd backend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
