# Task: BE-AUTO-002 - Refactor webhook automation to standard workflow

## Metadata
- Status: partial
- Estimate: 1h
- Depends on: BE-AUTO-001, BE-OPS-005

## Files to Modify
- `backend/src/modules/webhooks/webhook-automation.service.ts`
- `backend/src/modules/invoices/invoice-automation-policy.ts`
- `backend/src/modules/sepay/sepay.service.ts`

## Description
Apply the SePay automation policy to Pancake webhook automation. Full standard workflow refactor remains a future cleanup.

## Requirements
- Load automation policy for the shop.
- Skip with clear reason when auto create draft is disabled.
- Evaluate order status/payment eligibility from policy.
- Use existing mapper/validation/create draft flow with the new policy guard.
- Full removal of direct mapper usage from webhook automation is deferred.
- Mark webhook inbox as processed/skipped/failed with useful reason.
- Respect dry-run mode by logging/skipping side effects.

## Implementation Notes
- `webhook-automation.service.ts` now loads SePay automation settings and calls `evaluateAutoCreateDraft`.
- Legacy `tenant_shops.config_json.webhook_auto_create_draft` is kept as a compatibility signal, but real enqueue still respects `dry_run=false`.
- The webhook still calls `mapPancakeOrderToInvoicePreview` directly, so this task is intentionally marked partial rather than fully completed.
- Verification passed: backend typecheck and backend unit tests.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- This is the key backend alignment with Shichida flow.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
