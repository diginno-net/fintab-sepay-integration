# Task: PROD-002 - Implement Fintab Excel import

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: PROD-001

## Files to Modify
- `backend/src/modules/products/product-import.service.*` CREATE
- `backend/src/modules/products/products.routes.*` MODIFY

## Description
Implement import of Fintab Excel product export into product catalog.

## Requirements
- Accept Excel file upload.
- Validate required sheet/headers.
- Upsert by tenant, source and product code.
- Return inserted, updated, skipped and failed counts.
- Store raw row JSON for traceability.

## Verification
```bash
npm --prefix backend test -- product-import
```

## Notes
- Large imports may be moved to background job later if needed.
