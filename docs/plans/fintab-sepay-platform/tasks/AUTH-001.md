# Task: AUTH-001 - Implement identity and secure session auth

## Metadata
- Status: pending
- Estimate: 60m
- Depends on: DB-001

## Files to Modify
- `backend/src/modules/identity/*` CREATE
- `backend/src/shared/auth/*` CREATE

## Description
Implement secure login and httpOnly session cookie auth for the web admin. Each user belongs to one tenant and can access shops within that tenant.

## Requirements
- Login endpoint: POST /v1/auth/login (email + password)
- Current user endpoint: GET /v1/me -> returns { user, tenant, shops[] }
- The shops[] in /v1/me response lists all shops the current user has access to within the tenant
- httpOnly secure cookie session strategy
- Password/session handling suitable for admin MVP
- Auth middleware attaches user context (userId, tenantId, tenantShopId)
- Client-provided actor fields are ignored or rejected
- Login response must include tenant_id and shops[] for frontend to set initial context

## /v1/me Response Schema

```json
{
  "user": {
    "id": "uuid",
    "email": "ketoan@khacha.vn",
    "name": "Kế toán Khách A",
    "role": "accountant"
  },
  "tenant": {
    "id": "uuid",
    "name": "Công ty Khách A"
  },
  "shops": [
    {
      "id": "uuid",
      "name": "Chi nhánh 1",
      "status": "active",
      "hasPancakeConfig": true,
      "hasSepayConfig": false
    }
  ],
  "currentShopId": "uuid | null"
}
```

## Verification
```bash
npm --prefix backend test -- auth
```

## Notes
- Do not use browser-stored JWT as primary auth.
- /v1/me is called after login to populate frontend context
- shops[].hasSepayConfig tells frontend whether shop is fully configured for invoice issue