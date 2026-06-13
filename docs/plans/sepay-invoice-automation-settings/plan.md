# SePay Invoice Automation Settings Plan

## Goal

Implement shop-level SePay invoice automation settings:

- Dry run mode.
- Auto create invoice draft.
- Auto issue invoice after draft.
- Require accountant confirmation before auto issue.

## Architecture Decisions

- Store settings in `integration_configs.config_json` for provider `sepay`.
- Use safe defaults: dry run on, auto create off, auto issue off, confirmation required.
- Keep `tenant_shops.config_json.webhook_auto_create_draft` as a legacy compatibility signal only.
- Centralize business rules in a pure invoice automation policy service.
- Do not add a database migration for this phase.

## Settings Shape

```json
{
  "dry_run": true,
  "auto_create_invoice": false,
  "auto_issue_invoice": false,
  "require_accountant_confirmation_before_auto_issue": true
}
```

## Task List

- [x] Backend: extend SePay config GET/PUT with automation settings.
- [x] Frontend: add SePay settings toggles and submit payload.
- [x] Backend: add invoice automation policy service and unit tests.
- [x] Backend: apply policy to Pancake webhook automation.
- [x] Backend: apply policy to auto issue workflow if a safe hook exists.
- [x] Verification: backend typecheck/tests, frontend typecheck/tests/build.

## Status Log

- 2026-06-13: Plan created. Implementation started.
- 2026-06-13: Config API/UI, policy service, webhook policy, and draft-created auto-issue hook implemented; automated verification queued next.
- 2026-06-13: Verification passed: backend typecheck, backend unit tests, frontend typecheck, frontend tests, frontend build.
