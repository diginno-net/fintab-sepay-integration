# Task: BE-PAN-001 - Extend Pancake buyer normalization

## Metadata
- Status: completed
- Estimate: 35m
- Depends on: BE-REQ-002

## Files to Modify
- `backend/src/modules/pancake/pancake-normalizers.ts`

## Description
Extend Pancake normalization to expose company-related fields needed by invoice request suggestions.

## Requirements
- Extract tax code from common Pancake fields.
- Extract company name from `customer.company_info` when present.
- Preserve existing buyer normalization behavior.
- Add defensive handling for missing/unknown object shapes.

## Interface Definitions
```text
NormalizedBuyer should expose:
- name
- phone
- email
- address
- taxCode
- companyName optional/null
- hasCompanyInfo optional boolean
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Do not assume `company_info` always has the same nested shape.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
