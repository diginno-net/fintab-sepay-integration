# Task: INVJOB-002 - Implement create draft workflow

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: INVJOB-001, SEP-002

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.*` MODIFY
- `backend/src/modules/jobs/job-handlers.*` MODIFY/CREATE

## Description
Implement create draft enqueue endpoint and worker handlers for create and poll create.

## Requirements
- Endpoint returns 202 with job ID.
- RESOLVE SePay config: MUST use per-shop config (tenant_shop_id required)
- If shop has no SePay config: return error SHOP_SEPAY_CONFIG_REQUIRED (do not create job)
- Worker calls SePay create with draft mode.
- Poll create status up to configured max attempts.
- Store tracking code and reference code.
- Handle failed and timeout states.
- Audit create draft actions.

## Config Resolution for Draft Create

```
1. Get tenant_shop_id from request context
2. Lookup integration_configs WHERE tenant_shop_id = shop.id AND provider = 'sepay'
3. If NOT found AND env = production: return { error: { code: "SHOP_SEPAY_CONFIG_REQUIRED" } }
4. If NOT found AND env = sandbox: MAY use tenant-level config as fallback for onboarding
5. Proceed with resolved config
```

## Verification
```bash
npm --prefix backend test -- create-draft
```

## Notes
- HTTP request must not block for SePay polling.
- Always resolve SePay config from shop-level first.