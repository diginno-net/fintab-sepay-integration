# Task: FE-FORM-001 - Populate form from saved/suggested response

## Metadata
- Status: completed
- Estimate: 40m
- Depends on: FE-REQ-001

## Files to Modify
- `frontend/features/invoice-preview/invoice-request-form.tsx`

## Description
Update invoice request form loading logic to populate fields from either saved or Pancake-suggested API response.

## Requirements
- Use API response even when `id` is null.
- Populate buyer type, contact, email, phone, address, tax/company fields, identity, and confirmed state.
- Default safely when fields are null.
- Preserve existing save behavior.

## Verification
```bash
cd frontend && npm run typecheck
```

## Manual Check
```text
Open form for an order with no saved request; fields should be prefilled from Pancake suggestion.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
