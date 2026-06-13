# Plan: Backend Production Architecture Hardening

## Metadata
- **Feature slug**: `backend-production-architecture-hardening`
- **Created**: 2026-06-13
- **Status**: ready
- **Priority**: P0

## Overview
Harden backend từ solid MVP modular backend lên controlled production-ready integration platform cho Pancake POS ↔ SePay eInvoice. Scope tập trung vào reliability, security, audit, tenant isolation, integration guardrails, CI và production docs; không mở rộng business feature lớn.

## Technical Approach
Triển khai theo hướng hardening kiến trúc hiện tại, không rewrite:

```text
Fastify API
→ Auth/RBAC/Shop Access Guard
→ Application Service Layer where needed
→ Provider Adapters: Pancake / SePay
→ PostgreSQL
→ Custom Background Job Queue
→ Audit / Health / CI
```

Quyết định chính: giữ custom PostgreSQL queue hiện tại trong phase production này, harden retry/backoff/dead-letter trước; pg-boss migration để roadmap sau nếu cần.

## Why This Approach

### Alternatives Considered
| Option | Considered | Not chosen because |
|---|---:|---|
| Full DDD/hexagonal rewrite | ✅ | Tốn thời gian, rủi ro phá flow invoice đang hoạt động |
| Switch fully to pg-boss now | ✅ | Đúng hướng dài hạn nhưng refactor queue/worker lớn |
| Deploy first, fix later | ✅ | Không an toàn vì liên quan phát hành hóa đơn thật |
| Harden current architecture | ✅ | Ít rủi ro nhất, xử lý đúng blocker production |

### Trade-offs
- ✅ Ít thay đổi lớn và giữ business flow hiện có.
- ✅ Tập trung reliability/security/ops - đúng khoảng cách còn thiếu trước go-live.
- ✅ Có thể kiểm chứng bằng tests và manual sandbox E2E.
- ❌ Custom queue vẫn cần bảo trì.
- ❌ Chưa phải enterprise-scale platform đầy đủ.
- ❌ pg-boss vẫn là roadmap sau, không giải quyết trong phase này.

## Files to Create/Modify

### New Files
| File | Purpose |
|---|---|
| `backend/src/shared/security/origin-guard.ts` | Guard Origin/Referer cho mutating requests |
| `backend/src/shared/queue/job-retry-policy.ts` | Retry/backoff/dead-letter policy |
| `backend/tests/worker-retry.test.ts` | Test worker retry/backoff/dead-letter |
| `backend/tests/security-origin-guard.test.ts` | Test origin guard |
| `backend/tests/audit-critical-actions.test.ts` | Test audit log critical actions |
| `backend/tests/readiness-health.test.ts` | Test DB readiness endpoint |
| `docs/backend-architecture.md` | Backend architecture and decisions |
| `docs/production-checklist.md` | Backend production go-live checklist |
| `.github/workflows/ci.yml` | CI verification workflow |

### Modified Files
| File | Changes |
|---|---|
| `README.md` | Align queue architecture docs |
| `backend/src/config/env.ts` | Production env validation |
| `.env.example` | Add production env guidance |
| `backend/src/app.ts` | Register origin guard and readiness health |
| `backend/src/queue-worker.ts` | Harden locking/retry/backoff/dead-letter/logging |
| `backend/src/shared/queue/job-queue.ts` | Safer enqueue/retry helpers |
| `backend/src/modules/audit/audit.service.ts` | Audit helper/action constants |
| `backend/src/modules/identity/identity.routes.ts` | Audit login/logout |
| `backend/src/modules/integrations/integrations.routes.ts` | Audit config changes |
| `backend/src/modules/invoices/invoice.routes.ts` | Audit invoice actions |
| `backend/src/modules/jobs/jobs.routes.ts` | Audit retry/refresh actions |
| `backend/src/modules/webhooks/pancake-webhook.routes.ts` | Audit webhook configure |
| `backend/src/modules/tenant/tenant.routes.ts` | Audit shop access changes |
| `backend/src/modules/jobs/job-handlers.ts` | Standardize SePay response parsing if needed |
| SePay/invoice services as needed | Production issue guard |

## Tasks Overview
| ID | Title | Status | Estimate | Depends |
|---|---|---|---:|---|
| ARCH-001 | Document backend architecture and queue decision | ⏳ pending | 45m | - |
| ARCH-002 | Align docs with actual custom queue implementation | ⏳ pending | 30m | ARCH-001 |
| JOB-001 | Add retry policy helper | ⏳ pending | 45m | ARCH-001 |
| JOB-002 | Harden job claim locking | ⏳ pending | 1h | JOB-001 |
| JOB-003 | Implement retry/backoff/dead-letter | ⏳ pending | 1h | JOB-002 |
| JOB-004 | Add worker reliability tests | ⏳ pending | 1h | JOB-003 |
| SEC-001 | Strengthen production env validation | ⏳ pending | 45m | ARCH-001 |
| SEC-002 | Add origin guard for mutating requests | ⏳ pending | 1h | SEC-001 |
| SEC-003 | Add security tests | ⏳ pending | 1h | SEC-002 |
| AUD-001 | Define audit action constants/helper | ⏳ pending | 45m | ARCH-001 |
| AUD-002 | Wire audit for auth and config changes | ⏳ pending | 1h | AUD-001 |
| AUD-003 | Wire audit for invoice/job/webhook/shop access actions | ⏳ pending | 1h | AUD-001 |
| AUD-004 | Add audit critical action tests | ⏳ pending | 1h | AUD-002, AUD-003 |
| OPS-001 | Add DB readiness endpoint | ⏳ pending | 45m | ARCH-001 |
| OPS-002 | Add worker operational logging/runbook notes | ⏳ pending | 45m | JOB-003 |
| OPS-003 | Add readiness health tests | ⏳ pending | 45m | OPS-001 |
| TENANT-001 | Add tenant isolation tests for core resources | ⏳ pending | 1h | SEC-003 |
| TENANT-002 | Fix direct ID access leaks found by tests | ⏳ pending | 1h | TENANT-001 |
| INT-001 | Standardize SePay response parsing in poll handlers | ⏳ pending | 1h | JOB-003 |
| INT-002 | Add production issue guard | ⏳ pending | 1h | SEC-001 |
| INT-003 | Add integration guard tests | ⏳ pending | 1h | INT-001, INT-002 |
| CI-001 | Add GitHub Actions CI | ⏳ pending | 1h | JOB-004, SEC-003, AUD-004 |
| OPS-004 | Add backend production checklist | ⏳ pending | 1h | OPS-002 |
| OPS-005 | Add deployment verification commands | ⏳ pending | 45m | CI-001 |

## Execution Order
1. **Architecture lock**: ARCH-001 → ARCH-002
2. **Queue reliability**: JOB-001 → JOB-002 → JOB-003 → JOB-004
3. **Security**: SEC-001 → SEC-002 → SEC-003
4. **Audit**: AUD-001 → AUD-002 + AUD-003 → AUD-004
5. **Ops health**: OPS-001 → OPS-002 → OPS-003
6. **Tenant isolation**: TENANT-001 → TENANT-002
7. **Integration guardrails**: INT-001 → INT-002 → INT-003
8. **CI/docs**: CI-001 → OPS-004 → OPS-005

## Parallelization Notes
- JOB-* can run alongside SEC-* after ARCH-001.
- AUD-* can run after ARCH-001 and mostly parallel with queue/security.
- OPS-001 can run early.
- CI-001 should wait until main verification tasks exist.

## Verification Strategy
Run progressively per phase, then final gate:

```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

## Risks & Assumptions

### Risks
- Worker retry changes can affect invoice job state transitions.
- Origin guard can accidentally block Next.js frontend/server requests or Pancake webhook if exception is wrong.
- Audit wiring can accidentally log sensitive metadata if not standardized.
- Tenant isolation expansion may reveal existing direct-ID leaks requiring fixes.

### Assumptions
- Backend remains Fastify + PostgreSQL.
- Custom PostgreSQL queue is kept for this production phase.
- pg-boss migration is deferred.
- Production frontend origin is known and configured via env.
- Manual SePay sandbox credentials are available for final go-live rehearsal.

## Definition of Done
- Backend typecheck and tests pass.
- Worker supports retry/backoff/dead-letter and stale-lock recovery.
- Mutating routes have origin/CSRF-style protection.
- Production env fails fast on insecure defaults.
- Critical actions write safe audit logs.
- `/v1/ready` checks DB readiness.
- Tenant isolation tests cover core resources.
- SePay production issue guard is enforced.
- CI workflow exists and passes.
- Backend architecture and production checklist docs are updated.

## Task Files
- [ARCH-001](./tasks/ARCH-001.md)
- [ARCH-002](./tasks/ARCH-002.md)
- [JOB-001](./tasks/JOB-001.md)
- [JOB-002](./tasks/JOB-002.md)
- [JOB-003](./tasks/JOB-003.md)
- [JOB-004](./tasks/JOB-004.md)
- [SEC-001](./tasks/SEC-001.md)
- [SEC-002](./tasks/SEC-002.md)
- [SEC-003](./tasks/SEC-003.md)
- [AUD-001](./tasks/AUD-001.md)
- [AUD-002](./tasks/AUD-002.md)
- [AUD-003](./tasks/AUD-003.md)
- [AUD-004](./tasks/AUD-004.md)
- [OPS-001](./tasks/OPS-001.md)
- [OPS-002](./tasks/OPS-002.md)
- [OPS-003](./tasks/OPS-003.md)
- [TENANT-001](./tasks/TENANT-001.md)
- [TENANT-002](./tasks/TENANT-002.md)
- [INT-001](./tasks/INT-001.md)
- [INT-002](./tasks/INT-002.md)
- [INT-003](./tasks/INT-003.md)
- [CI-001](./tasks/CI-001.md)
- [OPS-004](./tasks/OPS-004.md)
- [OPS-005](./tasks/OPS-005.md)
