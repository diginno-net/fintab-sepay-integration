# Deployment Runbook

## Components
- Backend API: Fastify server from `backend`.
- Worker: `backend/src/queue-worker.ts` compiled to `dist/queue-worker.js`.
- Frontend: Next.js app from `frontend`.
- Database: PostgreSQL 16.

## Predeploy
```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix backend run test:integration
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

## Environment
- `NODE_ENV=production`
- `DATABASE_URL`
- `SESSION_SECRET`
- `ENCRYPTION_MASTER_KEY`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_BASE_URL`
- `JOBS_POLL_INTERVAL_MS`
- `RATE_LIMIT_MAX`
- `RATE_LIMIT_WINDOW_MS`

## Deploy Order
1. Backup production database or verify latest backup is restorable.
2. Deploy backend code artifact.
3. Run database migrations: `npm --prefix backend run db:migrate`.
4. Start backend API: `npm --prefix backend run start`.
5. Start worker: `npm --prefix backend run start:worker`.
6. Deploy frontend with `NEXT_PUBLIC_API_BASE_URL` set to backend API origin.
7. Verify `GET /v1/health` and `GET /v1/ready`.
8. Verify worker logs show startup and no startup failure.

## Rollback
1. Stop worker first if external API failures spike.
2. Roll backend API/frontend artifact back to the previous known-good version.
3. Do not roll database backward destructively without backup and explicit approval.
4. Re-run `GET /v1/ready` and inspect failed/dead-letter jobs before manual retry.

## Worker Operations
- `background_jobs.status` tracks worker execution.
- `invoice_jobs.status` tracks invoice business outcome.
- Stale `running` jobs with expired `locked_until` are eligible for recovery.
- Manual retry resets `attempts` and clears lock/dead-letter state.
