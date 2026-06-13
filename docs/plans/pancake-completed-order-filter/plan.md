# Pancake Completed Order Filter

## Context

The n8n workflow for MEW filters completed Pancake orders with these Pancake POS query parameters:

```text
filter_status[]=3
updateStatus=updated_at
startDateTime=<unix seconds>
endDateTime=<unix seconds>
option_sort=updated_at_desc
```

The backend currently supports pagination, search, scalar `status`, and legacy `date_from`/`date_to`, but it does not consistently support Pancake's completed-order filter format across invoice reads and sync jobs.

## Goal

Standardize completed-order filtering for invoice operations and order sync while preserving existing full-sync and legacy filters.

## Non-Goals

- Do not treat Pancake `status=3` as paid.
- Do not remove the existing payment guard before invoice issue.
- Do not add a database migration in this phase.

## Architecture

Add `backend/src/modules/pancake/pancake-order-filter.ts` as the anti-corruption layer that maps internal query inputs into Pancake POS order list query parameters.

Consumers:

- `pancake.routes.ts`
- `pancake-order-sync.service.ts`
- `invoice-order-read.service.ts`
- frontend invoice filters via `/v1/invoice-orders`

## Query Mapping

| Public/Internal Input | Pancake Query |
| --- | --- |
| `completedOnly=true` | `filter_status[]=3` |
| `completedDays=3` | `startDateTime=now-3d`, `endDateTime=now` |
| `filterStatus[]=3` | `filter_status[]=3` |
| `updateStatus=updated_at` | `updateStatus=updated_at` |
| `optionSort=updated_at_desc` | `option_sort=updated_at_desc` |
| `status=3` | fallback scalar `status=3` |
| `dateFrom/dateTo` | fallback `date_from/date_to` |

## Implementation Tasks

1. Create `pancake-order-filter.ts` with typed filter builder helpers.
2. Add unit tests for completed-order query, legacy fallback, array serialization inputs, and undefined cleanup.
3. Update Pancake client query typing and URL serialization to support array query values.
4. Update Pancake route schema and live list query building.
5. Update invoice route schema and invoice order read service.
6. Update order sync endpoint/service/worker payload to accept filter options.
7. Update invoice UI filters to expose completed-order and completed-days controls.
8. Run backend tests and typecheck.

## Acceptance Criteria

- Completed-order query emits `filter_status[]=3`, `updateStatus=updated_at`, Unix `startDateTime`, Unix `endDateTime`, and `option_sort=updated_at_desc`.
- Array query params are encoded as repeated query params by `PancakeClient.buildUrl`.
- `/v1/invoice-orders` accepts `completedOnly` and `completedDays`.
- `/v1/pancake/shops/:shopId/orders/sync` accepts `completedOnly` and `completedDays` without breaking current full sync.
- Existing payment policy tests still pass.

## Risks

- Pancake may interpret `filter_status[]` only when the query string is repeated; client URL serialization must append arrays, not stringify them.
- Snapshot mode can only filter by persisted fields; if a filtered live query is needed against Pancake, sync should be run with matching filters first.
- Completed order status is not payment status, so invoice issue still relies on `pancake-payment-policy`.
