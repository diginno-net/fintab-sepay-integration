# Plans Overview

## Active Plans

| Feature | Status | Plan | Notes |
|---|---|---|---|
| Fintab/Pancake POS x SePay Platform | ready | [fintab-sepay-platform](./fintab-sepay-platform/plan.md) | Full backend + frontend integration hub |
| Draft Invoice PDF Flow | implemented-foundation | [draft-invoice-pdf-flow](./draft-invoice-pdf-flow/plan.md) | Baseline draft/issue/job/PDF UI; extended by SePay Shichida Port |
| SePay Shichida Port | ready | [sepay-shichida-port](./sepay-shichida-port/plan.md) | Port production-hardening patterns from successful Shichida Wix project |

## Execution Command

```text
/exec fintab-sepay-platform
/exec draft-invoice-pdf-flow
/exec sepay-shichida-port
```

## Plan Relationships

```text
fintab-sepay-platform
  -> pancake-order-product-invoice-accuracy
  -> draft-invoice-pdf-flow
  -> sepay-shichida-port
```

`sepay-shichida-port` is now the source of truth for the next SePay implementation phase. It supersedes the rough PDF/download assumptions in `draft-invoice-pdf-flow` by using the proven Shichida implementation patterns: provider account picker, template/series validation, short-poll create/issue, refresh invoice, and normalized PDF/XML download.
