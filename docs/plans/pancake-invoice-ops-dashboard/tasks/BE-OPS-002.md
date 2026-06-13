# Task: BE-OPS-002 - Add batch invoice job/buyer request lookup helpers

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-OPS-001

## Files to Modify
- `backend/src/modules/invoices/invoice-job.service.ts`
- `backend/src/modules/invoices/invoice-buyer-request.service.ts`

## Description
Add batch lookup helpers so the invoice order read model can merge many Pancake orders with invoice jobs and buyer requests without N+1 queries.

## Requirements
- Add helper to fetch invoice jobs by tenant, shop, and a list of source order IDs.
- Add helper to fetch invoice buyer requests by tenant, shop, and a list of source order IDs.
- Return results in a shape easy to index by `sourceOrderId`.
- Preserve existing single-record functions.
- Ensure query remains tenant/shop scoped.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Use batch SQL semantics conceptually equivalent to `source_order_id IN (...)` or `ANY(orderIds)`.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
