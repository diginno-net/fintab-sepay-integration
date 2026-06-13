# Task: BE-INV-003 - Compact buyer payload shape

## Metadata
- Status: completed
- Estimate: 45m
- Depends on: BE-INV-002

## Files to Modify
- `backend/src/modules/invoices/invoice-mapper.ts`

## Description
Align buyer payload shape with Shichida behavior and avoid sending null company/personal fields to SePay.

## Requirements
- Company buyer payload includes type, name, legal name/company name, tax code, address, email, phone.
- Personal buyer payload includes type, name, optional identity, address, email, phone.
- Personal payload must not send tax code.
- Company payload must not send personal identity unless intentionally supported.
- Remove null/undefined fields before sending payload to SePay.

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Reference buyer behavior from Shichida `sepayMapper.js`.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
