# Task: BE-INV-002 - Fix tax_rate inclusion by template code

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: BE-INV-001

## Files to Modify
- `backend/src/modules/invoices/invoice-mapper.ts`

## Description
Fix invoice item tax rate inclusion so it follows SePay template code, not UI invoice type.

## Requirements
- Include `tax_rate` for template code `1`.
- Do not include `tax_rate` for template code `2`.
- Preserve existing tax resolution warnings.
- Keep fallback tax rate behavior.

## Verification
```bash
cd backend && npm run typecheck
```

## Manual Check
```text
Preview with template_code 1 includes tax_rate on line items.
Preview with template_code 2 omits tax_rate on line items.
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
