# Task: ARCH-001 - Document backend architecture and queue decision

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: -

## Files to Modify
- `docs/backend-architecture.md` (CREATE)

## Description
Create a backend architecture decision document that reflects the actual production target architecture and module boundaries.

## Requirements
- Document system type as integration hub/webhook platform.
- Document current runtime: Fastify API, PostgreSQL, Next.js frontend, separate worker process.
- Document actual queue decision: custom PostgreSQL `background_jobs` queue for this phase.
- State that pg-boss is deferred/future option unless later explicitly migrated.
- Describe module responsibilities for identity, tenant, access-control, integrations, pancake, sepay, invoices, jobs, webhooks, audit.
- Describe request flow and worker flow at architecture level.
- Describe production hardening priorities and known trade-offs.

## Verification
```bash
test -f docs/backend-architecture.md
```

## Notes
- Keep this as architecture documentation only.
- Do not change application behavior in this task.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
