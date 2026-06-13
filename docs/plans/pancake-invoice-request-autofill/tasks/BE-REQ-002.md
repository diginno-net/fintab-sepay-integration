# Task: BE-REQ-002 - Define saved/suggested response contract

## Metadata
- Status: completed
- Estimate: 20m
- Depends on: BE-REQ-001

## Files to Modify
- `backend/src/modules/invoices/invoice-buyer-request.schema.ts`

## Description
Define the API response contract for invoice buyer requests that can represent either saved DB data or suggested Pancake data.

## Requirements
- Add/adjust types to represent `source: saved | pancake`.
- Allow suggested records to have no database ID.
- Keep existing input schema compatible with PUT requests.
- Do not require `createdAt` or `updatedAt` for suggested data.

## Interface Definitions
```text
InvoiceBuyerRequestResponse:
- source: saved | pancake
- id: string or null
- buyerType: personal | company
- contactName, buyerEmail, buyerPhone, invoiceAddress
- taxCode, legalName, buyerUnitName, identityNumber
- paymentMethod, templateCode, invoiceSeries, taxRate
- notes, confirmed
- createdAt/updatedAt optional for suggested data
```

## Verification
```bash
cd backend && npm run typecheck
```

## Notes
- Keep DTO source-tagged so frontend can display the correct badge.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
