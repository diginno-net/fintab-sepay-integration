# Task 002: Route Migration

## Scope
- Migrate Pancake, invoice, integration, tax, products, jobs routes to action-specific shop checks.

## Acceptance Criteria
- Mutations require sufficient shop access level.
- Read routes continue to work for assigned shops.
- Unassigned shop returns 403.
