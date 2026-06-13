# Plan: Fintab/Pancake POS x SePay Platform

## Metadata

- **Feature slug**: `fintab-sepay-platform`
- **Created**: 2026-06-09
- **Status**: historical-superseded
- **Priority**: P0

## Decisions Locked

| Decision | Value |
|---|---|
| Repo structure | Monorepo: `backend/` + `frontend/` |
| Backend stack | Fastify + PostgreSQL + Zod + OpenAPI |
| Job queue | Custom PostgreSQL `background_jobs` queue; pg-boss deferred |
| Frontend stack | Next.js App Router + RSC + Tailwind CSS |
| Icon package | `@phosphor-icons/react` |
| Motion | Framer Motion, limited to isolated Client Components |
| Auth | httpOnly secure session cookie |
| Accent UI | Desaturated emerald |
| Invoice uniqueness | MVP: 1 Pancake order = 1 official invoice |
| SePay config | Per-shop: each shop must have its own SePay config for production issue |
| Tax mapping | Product tax profiles are required for accurate SePay invoice item tax mapping |

## Summary

| Metric | Value |
|---|---:|
| Total task files | 45 |
| Estimated time | 34-44h |
| Backend phases | 10 |
| Frontend phases | 4 |
| QA/Ops phases | 2 |

## Architecture

```text
Frontend Next.js App Router
-> Backend Fastify API
-> Auth + Tenant Context + RBAC
-> Pancake/SePay integration modules
-> Invoice Mapper + State Machine
-> Custom PostgreSQL background_jobs worker
-> PostgreSQL
-> Audit + Job History
```

## Execution Order

1. **Foundation**: SETUP-001, SETUP-002, SETUP-003, BE-001
2. **Core DB + Platform**: DB-001, AUTH-001, TENANT-001, RBAC-001, AUDIT-001
3. **Jobs + Configs**: JOB-001, INT-001, INT-002, INT-003
4. **Providers**: PAN-001, PAN-002, SEP-001, SEP-002
5. **Catalog + Tax + Mapping**: PROD-001, PROD-002, TAX-001, TAX-002, INV-001, INV-002
6. **Invoice Jobs**: INVJOB-001, INVJOB-002, INVJOB-003, INVJOB-004
7. **Webhooks**: WH-001, WH-002
8. **Frontend Foundation**: FE-001, FE-002, FE-003, FE-004
9. **Frontend Screens**: FE-101 through FE-110
10. **Hardening**: QA-001, QA-002, QA-003, OPS-001

## Tasks Overview

| ID | Title | Status | Estimate | Depends |
|---|---|---|---:|---|
| SETUP-001 | Initialize monorepo structure | pending | 30m | - |
| SETUP-002 | Configure backend tooling | pending | 45m | SETUP-001 |
| SETUP-003 | Configure frontend tooling | pending | 45m | SETUP-001 |
| BE-001 | Implement Fastify platform foundation | pending | 60m | SETUP-002 |
| DB-001 | Create database schema migrations | pending | 60m | BE-001 |
| AUTH-001 | Implement identity and secure session auth | pending | 60m | DB-001 |
| TENANT-001 | Implement tenant and shop context | pending | 60m | AUTH-001 |
| RBAC-001 | Implement RBAC permissions | pending | 45m | TENANT-001 |
| AUDIT-001 | Implement audit logging | pending | 45m | RBAC-001 |
| JOB-001 | Implement PostgreSQL background job infrastructure | superseded-by-custom-queue | 60m | DB-001 |
| INT-001 | Implement secret encryption and redaction | pending | 50m | BE-001 |
| INT-002 | Implement Pancake shop configuration | pending | 60m | TENANT-001, INT-001 |
| INT-003 | Implement SePay configuration | pending | 60m | TENANT-001, INT-001 |
| PAN-001 | Implement Pancake API client | pending | 60m | INT-002 |
| PAN-002 | Implement Pancake order/product endpoints | pending | 60m | PAN-001, RBAC-001 |
| SEP-001 | Implement SePay API client | pending | 60m | INT-003 |
| SEP-002 | Implement SePay token cache and endpoints | pending | 60m | SEP-001 |
| PROD-001 | Implement product catalog service | pending | 60m | DB-001 |
| PROD-002 | Implement Fintab Excel import | pending | 60m | PROD-001 |
| TAX-001 | Implement product tax profiles | pending | 60m | PROD-001 |
| TAX-002 | Implement tax resolution for invoice mapping | pending | 60m | TAX-001, PROD-001 |
| INV-001 | Implement invoice mapper | pending | 75m | PAN-002, PROD-001, TAX-002 |
| INV-002 | Implement invoice preview endpoint | pending | 75m | INV-001, TAX-002 |
| INVJOB-001 | Implement invoice job repository and idempotency | pending | 60m | INV-002, JOB-001 |
| INVJOB-002 | Implement create draft workflow | pending | 60m | INVJOB-001, SEP-002 |
| INVJOB-003 | Implement issue workflow | pending | 60m | INVJOB-002 |
| INVJOB-004 | Implement retry/check/download APIs | pending | 60m | INVJOB-003 |
| WH-001 | Implement webhook inbox | pending | 60m | INT-002, JOB-001 |
| WH-002 | Implement webhook automation policy | pending | 60m | WH-001, INVJOB-002 |
| FE-001 | Create frontend app shell | pending | 50m | SETUP-003 |
| FE-002 | Implement frontend design system | pending | 60m | FE-001 |
| FE-003 | Implement frontend API/auth foundation | pending | 60m | FE-001, AUTH-001 |
| FE-004 | Implement layout navigation and shop switcher | pending | 60m | FE-003, TENANT-001 |
| FE-101 | Build login and dashboard screens | pending | 60m | FE-004 |
| FE-102 | Build shop and integration config screens | pending | 60m | FE-004, INT-002, INT-003 |
| FE-103 | Build orders screens | pending | 60m | FE-004, PAN-002 |
| FE-104 | Build product catalog screens | pending | 60m | FE-004, PROD-002 |
| FE-105 | Build invoice preview screen | pending | 60m | FE-103, INV-002 |
| FE-106 | Build invoice issue and job polling screens | pending | 60m | FE-105, INVJOB-004 |
| FE-107 | Build audit and job history screens | pending | 60m | FE-004, AUDIT-001, JOB-001 |
| FE-108 | Add frontend motion and responsive polish | pending | 60m | FE-101..FE-107 |
| FE-109 | Add frontend security state pass | pending | 45m | FE-102, FE-106 |
| FE-110 | Build onboarding flow for new tenants | pending | 60m | FE-104 |
| QA-001 | Add backend integration tests | pending | 60m | INVJOB-004, WH-002 |
| QA-002 | Add frontend smoke tests | pending | 60m | FE-109 |
| OPS-001 | Add deployment and production checklist | pending | 60m | QA-001, QA-002 |

## Task Files

- [SETUP-001](./tasks/SETUP-001.md)
- [SETUP-002](./tasks/SETUP-002.md)
- [SETUP-003](./tasks/SETUP-003.md)
- [BE-001](./tasks/BE-001.md)
- [DB-001](./tasks/DB-001.md)
- [AUTH-001](./tasks/AUTH-001.md)
- [TENANT-001](./tasks/TENANT-001.md)
- [RBAC-001](./tasks/RBAC-001.md)
- [AUDIT-001](./tasks/AUDIT-001.md)
- [JOB-001](./tasks/JOB-001.md)
- [INT-001](./tasks/INT-001.md)
- [INT-002](./tasks/INT-002.md)
- [INT-003](./tasks/INT-003.md)
- [PAN-001](./tasks/PAN-001.md)
- [PAN-002](./tasks/PAN-002.md)
- [SEP-001](./tasks/SEP-001.md)
- [SEP-002](./tasks/SEP-002.md)
- [PROD-001](./tasks/PROD-001.md)
- [PROD-002](./tasks/PROD-002.md)
- [TAX-001](./tasks/TAX-001.md)
- [TAX-002](./tasks/TAX-002.md)
- [INV-001](./tasks/INV-001.md)
- [INV-002](./tasks/INV-002.md)
- [INVJOB-001](./tasks/INVJOB-001.md)
- [INVJOB-002](./tasks/INVJOB-002.md)
- [INVJOB-003](./tasks/INVJOB-003.md)
- [INVJOB-004](./tasks/INVJOB-004.md)
- [WH-001](./tasks/WH-001.md)
- [WH-002](./tasks/WH-002.md)
- [FE-001](./tasks/FE-001.md)
- [FE-002](./tasks/FE-002.md)
- [FE-003](./tasks/FE-003.md)
- [FE-004](./tasks/FE-004.md)
- [FE-101](./tasks/FE-101.md)
- [FE-102](./tasks/FE-102.md)
- [FE-103](./tasks/FE-103.md)
- [FE-104](./tasks/FE-104.md)
- [FE-105](./tasks/FE-105.md)
- [FE-106](./tasks/FE-106.md)
- [FE-107](./tasks/FE-107.md)
- [FE-108](./tasks/FE-108.md)
- [FE-109](./tasks/FE-109.md)
- [FE-110](./tasks/FE-110.md)
- [QA-001](./tasks/QA-001.md)
- [QA-002](./tasks/QA-002.md)
- [OPS-001](./tasks/OPS-001.md)
