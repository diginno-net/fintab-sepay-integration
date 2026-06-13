# Completion Plan: Multi-Shop Access Context

## Current Status

Foundation has been implemented:

- `user_shop_access` exists.
- `sessions.current_tenant_shop_id` exists.
- `/v1/me` returns accessible shops.
- `PUT /v1/me/current-shop` persists current shop.
- Major backend routes are guarded by shop access.
- `ShopSwitcher` persists selected shop.
- Main navigation preserves `shopId`.

## Remaining Goal

Finish production readiness for per-shop login/access:

1. Add user-shop assignment management.
2. Restrict real users to their intended shops.
3. Fix any remaining links/pages that can lose `shopId`.
4. Harden remaining product/tax/invoice edge guards.
5. Add explicit cross-shop security tests.

## Task Overview

| ID | Title | Priority | Estimate |
| --- | --- | --- | --- |
| BE-013 | Add user-shop access management APIs | High | 1h |
| FE-008 | Add user-shop access management UI | High | 1h 30m |
| OPS-001 | Restrict real user-shop access rows | High | 30m |
| FE-009 | Preserve `shopId` across all internal links | High | 1h |
| FE-010 | Add page-level shop redirect/invalid-shop handling | High | 45m |
| BE-014 | Harden product detail/lookup shop access | High | 40m |
| BE-015 | Harden tax profile shop access | High | 35m |
| BE-016 | Add invoice access helper for derived job guards | Medium | 35m |
| QA-004 | Add cross-shop backend security tests | High | 1h 30m |
| FE-011 | Polish header account/shop display | Medium | 30m |
| FE-012 | Add no-shop state | Medium | 30m |

## Recommended Execution Order

### Batch 1: User-Shop Management

1. BE-013
2. FE-008
3. OPS-001

### Batch 2: Stable Shop Context UX

1. FE-009
2. FE-010
3. FE-011
4. FE-012

### Batch 3: Security Hardening

1. BE-014
2. BE-015
3. BE-016
4. QA-004

## Acceptance Criteria

- Admin can assign users to one or more shops.
- Normal shop user sees only assigned shop(s).
- User cannot access another shop by editing URL/API request.
- Navigation never silently switches to a different shop.
- Product/tax/invoice derived resources are checked against accessible shops.
- Automated tests cover cross-shop denial.

## Verification Commands

```bash
npm --prefix backend test
npm --prefix backend run typecheck
npm --prefix frontend run typecheck
```
