# Task: BE-PAN-002 - Build suggested invoice request

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-PAN-001

## Files to Modify
- `backend/src/modules/invoices/invoice-request-suggestions.ts` (CREATE)

## Description
Create helper that builds a suggested invoice request from a Pancake order and SePay shop config.

## Requirements
- Build `source: pancake` suggested request.
- Use Pancake buyer, shipping, and company information.
- Auto-detect `buyerType = company` when tax code or company info exists.
- Fill SePay config defaults for payment method, template code, invoice series, and tax rate.
- Set `confirmed` to false for suggestions.
- Do not persist anything in this helper.

## Mapping Rules
```text
contactName: bill_full_name -> shipping full name -> customer name -> Khách lẻ
buyerEmail: bill_email -> customer first email
buyerPhone: bill_phone_number -> shipping phone -> customer first phone
invoiceAddress: shipping full address -> shipping address -> customer address
taxCode: customer tax code -> company info tax code -> order tax code
buyerUnitName/legalName: company info company name
buyerType: company if tax/company info exists, otherwise personal
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Suggested data is display/input data, not proof that the invoice is ready to issue.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
