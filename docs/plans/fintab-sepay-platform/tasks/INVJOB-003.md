# Task: INVJOB-003 - Implement issue workflow

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: INVJOB-002

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.*` MODIFY
- `backend/src/modules/jobs/job-handlers.*` MODIFY

## Description
Implement invoice issue enqueue endpoint and worker handlers for issue and poll issue. PRODUCTION ISSUE REQUIRES per-shop SePay config.

## Requirements
- Validate RBAC `invoice:issue`.
- Validate invoice is draft before issue.
- PRODUCTION: MUST have shop-level SePay config. If missing, return SHOP_SEPAY_CONFIG_REQUIRED.
- Endpoint returns 202 with job ID.
- Worker calls SePay issue.
- Poll issue status.
- Store invoice number, issued date and download availability.
- Audit issue actions.

## Production SePay Config Enforcement

```
Issue workflow MUST resolve shop-level SePay config:
1. Get tenant_shop_id from invoice_jobs record
2. Lookup integration_configs WHERE tenant_shop_id = shop.id AND provider = 'sepay'
3. If NOT found (PRODUCTION): BLOCK, return SHOP_SEPAY_CONFIG_REQUIRED
4. Proceed with resolved shop-level config only
5. NO tenant-level fallback for production issue
```

## Verification
```bash
npm --prefix backend test -- issue-invoice
```

## Notes
- COD policy must be enforced according to config.
- Production issue is BLOCKED without shop-level SePay config.