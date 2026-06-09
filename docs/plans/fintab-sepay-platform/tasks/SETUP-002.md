# Task: SETUP-002 - Configure backend tooling

## Metadata
- Status: pending
- Estimate: 45m
- Depends on: SETUP-001

## Files to Modify
- `backend/package.json` CREATE
- `backend/tsconfig.json` CREATE
- `backend/src/` CREATE
- backend lint/test config files CREATE

## Description
Set up the backend TypeScript project for Fastify, PostgreSQL, Zod, OpenAPI, pg-boss and tests.

## Requirements
- Add Node.js 20+ TypeScript tooling.
- Add scripts for dev, build, typecheck, test and lint.
- Add dependencies needed for backend platform foundation.
- Include pg-boss-compatible dependencies.

## Verification
```bash
npm --prefix backend run typecheck
npm --prefix backend test
```

## Notes
- No provider logic in this task.
