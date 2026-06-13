# Plans Overview

## Active Plans

| Feature | Status | Plan | Notes |
|---|---|---|---|
| Fintab/Pancake POS x SePay Platform | historical-superseded | [fintab-sepay-platform](./fintab-sepay-platform/plan.md) | Original platform plan; current runtime decisions are captured in later implementation/hardening plans |
| Draft Invoice PDF Flow | implemented-foundation | [draft-invoice-pdf-flow](./draft-invoice-pdf-flow/plan.md) | Baseline draft/issue/job/PDF UI; extended by SePay Shichida Port |
| SePay Shichida Port | ready | [sepay-shichida-port](./sepay-shichida-port/plan.md) | Port production-hardening patterns from successful Shichida Wix project |
| Pancake Invoice Request Autofill | implemented-e2e-verified | [pancake-invoice-request-autofill](./pancake-invoice-request-autofill/plan.md) | Auto-fill invoice request form from Pancake order with saved-over-suggested Shichida flow; automated and API E2E verified |
| Pancake Invoice Ops Dashboard | mvp-implemented-basic-verified | [pancake-invoice-ops-dashboard](./pancake-invoice-ops-dashboard/plan.md) | Shichida-like order-centered invoice dashboard MVP implemented; automation continued in SePay Invoice Automation Settings |
| SePay Invoice Automation Settings | implemented-verified | [sepay-invoice-automation-settings](./sepay-invoice-automation-settings/plan.md) | SePay settings toggles, safe defaults, automation policy, webhook policy, and guarded auto-issue hook implemented |
| Backend Production Architecture Hardening | ready | [backend-production-architecture-hardening](./backend-production-architecture-hardening/plan.md) | Final backend reliability/security/ops hardening before controlled production go-live |

## Execution Command

```text
/exec fintab-sepay-platform
/exec draft-invoice-pdf-flow
/exec sepay-shichida-port
/exec pancake-invoice-request-autofill
/exec pancake-invoice-ops-dashboard
/exec sepay-invoice-automation-settings
/exec backend-production-architecture-hardening
```

## Plan Relationships

```text
fintab-sepay-platform
  -> pancake-order-product-invoice-accuracy
  -> draft-invoice-pdf-flow
  -> sepay-shichida-port
  -> pancake-invoice-request-autofill
  -> pancake-invoice-ops-dashboard
  -> sepay-invoice-automation-settings
  -> backend-production-architecture-hardening
```

`sepay-shichida-port` is now the source of truth for the next SePay implementation phase. It supersedes the rough PDF/download assumptions in `draft-invoice-pdf-flow` by using the proven Shichida implementation patterns: provider account picker, template/series validation, short-poll create/issue, refresh invoice, and normalized PDF/XML download.

`pancake-invoice-request-autofill` extends the Shichida flow specifically for Pancake buyer data: GET invoice request returns saved data when present or a Pancake-built suggestion when absent, while preserving saved-over-suggested behavior before preview/create/issue. Implementation is complete; automated checks and API E2E pass.

`pancake-invoice-ops-dashboard` makes the product operationally match Shichida: `/invoices` is now an order-centered invoice dashboard with stats, filters, row actions, invoice request panel, and bulk actions.

`sepay-invoice-automation-settings` adds the SePay automation configuration layer: dry run, auto-create, auto-issue, accountant confirmation guard, policy service, webhook policy enforcement, and a guarded auto-issue hook after draft creation.

`backend-production-architecture-hardening` is the final backend go-live hardening phase: lock architecture decisions, harden the custom PostgreSQL queue, add production security guards, wire critical audit logs, expand tenant isolation tests, add readiness checks, CI, and production checklist docs.
