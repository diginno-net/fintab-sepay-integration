# Production Checklist

## Required Environment
- `NODE_ENV=production`
- `DATABASE_URL` points to production PostgreSQL.
- `SESSION_SECRET` is unique, strong, and at least 32 characters.
- `ENCRYPTION_MASTER_KEY` is unique, strong, and at least 32 characters.
- `CORS_ORIGIN` contains explicit HTTPS frontend origin(s), never wildcard.
- `NEXT_PUBLIC_API_BASE_URL` points to the production API URL.
- `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, and `JOBS_POLL_INTERVAL_MS` are reviewed.

## Predeploy Verification
```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

## Deploy Steps
1. Apply database migrations.
2. Start backend API process.
3. Start worker process with the same production environment.
4. Start frontend with production API URL.
5. Verify `/v1/health` returns `ok`.
6. Verify `/v1/ready` returns `ready`.

## Worker Verification
- Confirm worker startup log includes polling interval and redacted database URL.
- Create or retry a test background job and verify it transitions from `queued` to `succeeded`.
- Verify failed jobs retry with increasing attempts and move to `failed` with `dead_lettered_at` after max attempts.
- Verify stale `running` jobs with expired `locked_until` are recoverable by the worker.
- Remember: background job status tracks worker execution; invoice job status tracks invoice business outcome.

## Integration Rehearsal
1. Login with production-admin test account.
2. Configure a Pancake shop and test connection.
3. Configure SePay sandbox credentials for the shop.
4. Load provider accounts and select template/series.
5. Verify SePay automation settings default to safe mode: `dry_run=true`, `auto_create_invoice=false`, `auto_issue_invoice=false`, `require_accountant_confirmation_before_auto_issue=true`.
6. Sync or load Pancake orders.
7. Open `/invoices` and preview an order.
8. Create draft and verify worker processing.
9. Refresh/check status until draft is created.
10. Issue invoice in sandbox.
11. Download PDF/XML.
12. If testing automation, keep `dry_run=true` first and verify webhook automation skips real create/issue; only set `dry_run=false` in sandbox after manual draft/issue flow is verified.
13. Verify audit logs for config update, draft request, issue request, download, and retry if tested.

See `docs/go-live-rehearsal.md` for the full signoff flow.

## Security Review
- Review `docs/security-audit.md` before go-live.
- Do not run `npm audit fix --force` directly on production branches without full verification.

## Rollback Notes
- Keep previous API/frontend artifacts available.
- If worker errors spike, stop worker first to prevent further external calls.
- Use manual retry only after root cause is identified.
- Never run destructive database commands in production without backup and explicit approval.
