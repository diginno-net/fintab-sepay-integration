# Task: BE-API-001 - Update GET request route

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-PAN-003

## Files to Modify
- `backend/src/modules/invoices/invoice.routes.ts`

## Description
Change invoice request GET route to return saved request or Pancake suggestion.

## Requirements
- Route must check tenant/shop permission as current behavior does.
- Load Pancake order only when needed to build suggestion.
- Load SePay config to fill defaults in suggested request.
- Return a source-tagged DTO.
- Preserve permission requirement `invoice:read`.
- Keep errors user-friendly if Pancake order cannot be loaded.

## Verification
```bash
cd backend && npm run typecheck
```

## Manual Check
```text
GET /v1/invoices/requests/:shopId/:orderId returns source=saved when DB row exists.
GET /v1/invoices/requests/:shopId/:orderId returns source=pancake when no DB row exists.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
