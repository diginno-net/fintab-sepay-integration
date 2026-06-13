# Task 001: Backend Policy And Hotfixes

## Scope
- Add shop access policy matrix.
- Add action-specific assertion.
- Validate target user belongs to tenant.
- Fix products list filtering by accessible shops.

## Acceptance Criteria
- Cross-tenant user assignment is rejected.
- Product list without `shopId` only returns allowed shops plus global products.
- Policy matrix is unit-testable.
