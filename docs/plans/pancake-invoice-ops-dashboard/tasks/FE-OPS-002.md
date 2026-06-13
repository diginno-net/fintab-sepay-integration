# Task: FE-OPS-002 - Build invoice order stats component

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: FE-OPS-001

## Files to Modify
- `frontend/features/invoice-ops/invoice-order-stats.tsx` (CREATE)

## Description
Create stats cards similar to Shichida: total orders, issued, pending/processing, failed/requires attention.

## Requirements
- Render stats from backend `InvoiceOrderStats`.
- Use existing app visual language and `StatCard` where appropriate.
- Use tabular numeric styling for counts.
- Support zero state cleanly.
- Keep component presentational.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
