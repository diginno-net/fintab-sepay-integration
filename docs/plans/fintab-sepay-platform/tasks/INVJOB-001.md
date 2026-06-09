# Task: INVJOB-001 - Implement invoice job repository and idempotency

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: INV-002, JOB-001

## Files to Modify
- `backend/src/modules/invoices/invoice-job.service.*` CREATE
- `backend/src/modules/invoices/invoice-state-machine.*` CREATE

## Description
Implement invoice job persistence, idempotency and state transition guardrails.

## Requirements
- Enforce MVP uniqueness by tenant, shop, source and source order.
- Reuse existing processing job instead of duplicating.
- Block already issued order.
- Allow retry according to failed/timeout policy.
- Store source order snapshot and request payload.

## Verification
```bash
npm --prefix backend test -- invoice-idempotency
```

## Notes
- This task does not call SePay directly.
