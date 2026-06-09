# Task: PROD-001 - Implement product catalog service

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: DB-001

## Files to Modify
- `backend/src/modules/products/product-catalog.service.*` CREATE
- `backend/src/modules/products/products.routes.*` CREATE

## Description
Implement product catalog storage and lookup used by invoice mapping.

## Requirements
- Store product source, code, name, unit, group, status and raw JSON.
- Lookup by source product code and barcode where available.
- Tenant scoped product access.
- Products API for list and lookup.

## Verification
```bash
npm --prefix backend test -- products
```

## Notes
- Product catalog enriches order data but does not replace source order data.
