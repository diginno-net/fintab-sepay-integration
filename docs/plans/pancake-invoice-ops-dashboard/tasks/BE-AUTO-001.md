# Task: BE-AUTO-001 - Add automation policy service/routes

## Metadata
- Status: completed-basic
- Estimate: 1h
- Depends on: BE-OPS-006

## Files to Modify
- `backend/src/modules/invoices/invoice-automation-policy.ts` (created)
- `backend/src/modules/invoices/invoice-automation-policy.test.ts` (created)
- `backend/src/modules/integrations/integrations.routes.ts`
- `backend/src/modules/sepay/sepay.service.ts`

## Description
Add backend support for invoice automation policy and SePay settings storage.

## Requirements
- Define implemented automation policy fields: dry run, auto create invoice, auto issue invoice, require confirmation before auto issue.
- Load policy from SePay config with safe defaults.
- Save policy back to SePay config.
- Reuse existing SePay config GET and PUT routes.
- Validate policy input.
- Default auto issue to off and require confirmation to on.

## Interface Definitions
```text
InvoiceAutomationPolicy:
- dryRun
- autoCreateInvoice
- autoIssueInvoice
- requireAccountantConfirmationBeforeAutoIssue
```

## Implementation Notes
- Implemented under [`sepay-invoice-automation-settings`](../../sepay-invoice-automation-settings/plan.md).
- Deferred fields from the original rough scope (`autoConfirmPersonalInvoice`, status selector fields, default invoice type) are not part of the current implemented SePay settings contract.
- Verification passed: backend typecheck and backend unit tests.

## Verification
```bash
cd backend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
