# Task: BE-OPS-001 - Define invoice order status/action model

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: none

## Files to Modify
- `backend/src/modules/invoices/invoice-order-status.ts` (CREATE)

## Description
Create the domain/read-model status mapping for order-centered invoice operations. This translates Pancake order data, invoice job state, buyer request state, and draft freshness into UI-ready status/action flags.

## Requirements
- Define invoice order statuses: `not_created`, `draft_queued`, `draft_created`, `issue_queued`, `issued`, `failed`, `requires_draft_recreate`, `cancelled`, `processing`.
- Map existing `invoice_jobs.status` values into user-facing invoice statuses.
- Compute action eligibility flags for create draft, recreate draft, issue, retry, refresh, download PDF/XML, and edit invoice info.
- Include user-facing Vietnamese labels.
- Keep this file framework-free and database-free.

## Interface Definitions
```text
InvoiceOrderStatus:
- not_created
- draft_queued
- draft_created
- issue_queued
- issued
- failed
- requires_draft_recreate
- cancelled
- processing

InvoiceOrderActions:
- canEditInvoiceInfo
- canCreateDraft
- canRecreateDraft
- canIssue
- canRetry
- canRefresh
- canDownloadPdf
- canDownloadXml
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Frontend should not duplicate this business status logic.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
