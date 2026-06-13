# Task: FE-OPS-004 - Build invoice order table and row

## Metadata
- Status: completed
- Estimate: 1h
- Depends on: FE-OPS-002, FE-OPS-003

## Files to Modify
- `frontend/features/invoice-ops/invoice-order-table.tsx` (CREATE)
- `frontend/features/invoice-ops/invoice-order-row.tsx` (CREATE)

## Description
Create the Shichida-like table showing each Pancake order with payment state, invoice state and operation affordances.

## Requirements
- Columns: selection, order, customer, total, payment, invoice, actions.
- Render invoice status badge using backend labels/status.
- Render payment status badge.
- Show invoice number/reference when available.
- Show draft recreate warning state clearly.
- Support empty/loading/error states.
- Do not embed action mutation logic directly in row; delegate to action component later.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
