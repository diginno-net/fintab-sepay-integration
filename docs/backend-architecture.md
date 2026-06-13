# Backend Architecture

## Context
This backend is an integration hub/webhook platform connecting Pancake POS with SePay eInvoice. The main production risks are tenant/shop isolation, invoice idempotency, external API failures, retry reliability, auditability, and safe production issue guards.

## Runtime Shape
```text
Next.js frontend
→ Fastify API
→ PostgreSQL
→ Custom PostgreSQL background_jobs queue
→ Worker process
→ Pancake POS / SePay eInvoice APIs
```

## Queue Decision
The active runtime queue is the custom PostgreSQL `background_jobs` table processed by `backend/src/queue-worker.ts`.

`pg-boss` may be considered later, but it is not the active architecture for this production-hardening phase. Before production, the custom queue must support lock expiry, retry/backoff, attempts, and dead-letter behavior.

## Module Boundaries
| Module | Responsibility |
|---|---|
| `identity` | Session auth, login/logout, current user |
| `tenant` | Tenants, shops, shop access context |
| `access-control` | RBAC permissions |
| `integrations` | Per-shop Pancake/SePay configuration and encrypted secrets |
| `pancake` | Pancake POS API adapter and order/product sync |
| `sepay` | SePay eInvoice API adapter, token cache, provider/template validation |
| `invoices` | Invoice preview, state machine, workflows, idempotent invoice jobs |
| `jobs` | Operational job API and retry controls |
| `webhooks` | Pancake inbound webhook inbox/dedupe/automation entrypoint |
| `audit` | Security/business audit log sink |

## Request Flow
```text
HTTP request
→ Origin guard for mutating browser requests
→ Auth/RBAC/shop-access guard
→ Zod validation
→ Route/application service
→ DB/provider adapter
→ Audit log for critical actions
→ Response envelope
```

## Worker Flow
```text
queued job due by run_after
or stale running job with expired locked_until
→ claim with FOR UPDATE SKIP LOCKED, status=running, and locked_until
→ execute handler
→ succeeded: clear lock, completed_at
→ transient failure: attempts++, run_after backoff, clear lock
→ exhausted attempts: failed, dead_lettered_at, clear lock
```

## Job vs Invoice Status Semantics
`background_jobs.status` represents worker execution status. `invoice_jobs.status` represents invoice business outcome.

If SePay or validation returns a business-level invoice failure that the handler records cleanly, the background job may still be `succeeded` because the worker executed the handler successfully. Operators must use invoice status as the source of truth for invoice outcome, and job status as the source of truth for worker reliability.

## Invoice Automation Policy
SePay invoice automation settings are stored per shop in `integration_configs.config_json` for provider `sepay`:

```json
{
  "dry_run": true,
  "auto_create_invoice": false,
  "auto_issue_invoice": false,
  "require_accountant_confirmation_before_auto_issue": true
}
```

Safe defaults are mandatory: dry run is enabled, auto create and auto issue are disabled, and accountant confirmation is required before auto issue. Business rules are centralized in `backend/src/modules/invoices/invoice-automation-policy.ts`.

Webhook automation reads the SePay automation settings and keeps `tenant_shops.config_json.webhook_auto_create_draft` only as a legacy compatibility signal. A legacy auto-create signal still cannot enqueue real SePay work while `dry_run=true`.

After a draft reaches `draft_created`, `backend/src/modules/jobs/job-handlers.ts` calls a guarded auto-issue helper. Auto issue must pass the policy guard and then reuse `enqueueIssueJob`, preserving the existing draft freshness and SePay readiness checks.

## Production Gates
Run before go-live:
```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

Manual go-live rehearsal must cover Pancake connection, SePay sandbox connection, invoice preview, create draft, worker processing, issue, refresh, PDF/XML download, failed job retry, and audit log verification.
