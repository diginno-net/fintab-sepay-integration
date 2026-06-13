# Multi-Shop Access Context

## Goal

Ensure each signed-in user only sees shops they are assigned to, and preserve the selected shop when moving across platform pages.

## Current Problems

- `/v1/me` returns all shops in the tenant.
- `currentShopId` is recalculated as the first tenant shop.
- Main navigation links do not preserve `shopId`.
- Backend checks tenant ownership, but not user-to-shop access.

## Target Architecture

```text
users -> memberships -> user_shop_access -> tenant_shops
```

Runtime flow:

```text
request -> requireAuth -> requirePermission -> assertUserCanAccessShop -> service/query
```

Frontend flow:

```text
/v1/me -> allowed shops + currentShopId -> ShopSwitcher -> URL shopId -> page APIs
```

## Phases

1. Add `user_shop_access` and session current shop persistence.
2. Add `shop-access.service.ts`.
3. Update `/v1/me` and add `PUT /v1/me/current-shop`.
4. Guard shop-scoped backend routes.
5. Preserve `shopId` in frontend navigation and switcher.
6. Verify with backend tests and typechecks.

## Acceptance Criteria

- `/v1/me` returns only accessible shops.
- User cannot set current shop to an inaccessible shop.
- User cannot call shop-scoped APIs for another shop.
- Nav links preserve current `shopId`.
- User with one shop sees a stable single-shop context.
