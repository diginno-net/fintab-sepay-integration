# Security Audit Notes

Generated from `npm audit --json` during production readiness review.

## Current Findings
| Package | Severity | Scope | Status |
|---|---:|---|---|
| `happy-dom` | critical/high | frontend tests/dev | Deferred: fix requires major upgrade to `20.10.3`; not production runtime. |
| `vitest`, `vite`, `vite-node`, `@vitest/mocker`, `@vitejs/plugin-react`, `esbuild` | high | test/build tooling | Deferred: fix requires major upgrades; run in CI/dev only. |
| `next`/nested `postcss` | moderate | frontend build/runtime dependency | Needs framework-compatible upgrade review; `npm audit` suggested downgrade is not actionable. |
| `xlsx` | high | backend production dependency for product import | No npm fix available. Must restrict uploads to trusted admins, keep file size limits, and consider replacing SheetJS before broad public import exposure. |

## Decisions
- Do not run `npm audit fix --force` automatically because available fixes include semver-major or non-actionable framework changes.
- Treat `xlsx` as the main production dependency risk because it is used by backend import code.
- Before public file import exposure, replace `xlsx` or sandbox/strictly validate import files.

## Required Follow-up
1. Evaluate upgrading frontend test stack: `vitest`, `vite`, `@vitejs/plugin-react`, `happy-dom`.
2. Evaluate replacing `xlsx` with a maintained parser or constraining import feature to trusted admins only.
3. Re-run full verification after dependency changes.
