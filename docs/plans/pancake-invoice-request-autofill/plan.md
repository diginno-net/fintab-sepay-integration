# Plan: Pancake Invoice Request Autofill

## Metadata
- **Feature slug**: `pancake-invoice-request-autofill`
- **Created**: 2026-06-11
- **Status**: implemented-e2e-verified
- **Priority**: P0
- **Reference project**: `/Users/hangha/diginno/plugin wix/shichida-sepay-einvoice`
- **Extends**: [`sepay-shichida-port`](../sepay-shichida-port/plan.md)

## Overview
Auto-fill form **Thông tin HĐ** từ Pancake order khi chưa có request đã lưu. Nếu user đã lưu thủ công, dữ liệu saved luôn thắng dữ liệu Pancake.

## Implementation Status
- **Backend implementation**: completed
- **Frontend implementation**: completed
- **Automated verification**: completed
- **Manual/API E2E**: completed
- **Implemented on**: 2026-06-11

## Implemented Behavior
1. `GET /v1/invoices/requests/:shopId/:orderId` returns `source: saved` when a persisted request exists.
2. If no persisted request exists, backend fetches Pancake order and returns `source: pancake` suggested data.
3. `PUT /v1/invoices/requests/:shopId/:orderId` normalizes, validates, upserts, and returns `source: saved`.
4. Preview/create draft uses the same saved-or-suggested request pipeline.
5. Create draft validates confirmed request, email, payment method, template, series, and company fields.
6. Issue is blocked when invoice request changed after draft creation or company request mismatches draft payload.
7. Frontend form auto-fills from Pancake, shows source badges, tracks dirty state, and displays draft outdated warnings.

## Technical Approach
Backend là source of truth cho invoice request data:

1. `GET /v1/invoices/requests/:shopId/:orderId` trả saved request nếu có.
2. Nếu chưa có saved request, backend fetch Pancake order và build suggested request.
3. Response luôn có `source: saved | pancake` để frontend hiển thị đúng trạng thái.
4. `PUT` normalize + validate + upsert, sau đó trả `source: saved`.
5. Preview/create draft dùng cùng request pipeline để tránh lệch dữ liệu giữa form và payload.

## Why This Approach

### Alternatives Considered
| Option | Considered | Not chosen because |
|---|---:|---|
| Frontend maps Pancake order directly | ✅ | Mapping rule bị phân tán, preview/create draft không reuse được |
| Auto-save suggestion when GET is called | ✅ | Có thể ghi DB trước khi user xác nhận |
| Only prefill UI, keep backend preview unchanged | ✅ | Tạo nháp vẫn có thể dùng request null/sai |
| Backend returns saved-or-suggested DTO | ✅ | Centralized, matches Shichida proven flow, safe saved-wins behavior |

### Trade-offs
- ✅ Centralized mapping/validation.
- ✅ Protects user-edited data.
- ✅ Frontend only renders API response.
- ✅ Preview/create draft can reuse same request source.
- ❌ GET may call Pancake API when no saved request exists.
- ❌ Frontend API types must be updated because response shape changes.

## Files to Create/Modify

### New Files
| File | Purpose |
|---|---|
| `backend/src/modules/invoices/invoice-request-normalizers.ts` | Clean/sanitize/normalize invoice requests |
| `backend/src/modules/invoices/invoice-request-suggestions.ts` | Build suggested request from Pancake order |
| `backend/src/modules/invoices/invoice-request-rules.ts` | Save/draft/company/freshness validation rules |

### Modified Files
| File | Changes |
|---|---|
| `backend/src/modules/invoices/invoice-buyer-request.schema.ts` | Add source-aware response shape if needed |
| `backend/src/modules/invoices/invoice-buyer-request.service.ts` | Fix SQL alias, saved/suggested service helpers |
| `backend/src/modules/invoices/invoice.routes.ts` | GET saved/suggested, PUT normalize/validate, richer draft-status |
| `backend/src/modules/invoices/invoice.service.ts` | Preview uses saved or suggested request |
| `backend/src/modules/invoices/invoice-mapper.ts` | Tax-rate by template code, compact buyer payload |
| `backend/src/modules/invoices/invoice-job.service.ts` | Issue guard for outdated/wrong-company draft |
| `backend/src/modules/invoices/invoice-validation.ts` | Reuse new invoice request rules |
| `backend/src/modules/pancake/pancake-normalizers.ts` | Extend company fields extraction |
| `frontend/features/invoices/invoice-buyer-request-client.ts` | Add source/suggested response and richer draft status types |
| `frontend/features/invoice-preview/invoice-request-form.tsx` | Auto-fill, badges, dirty state, draft warning |
| `frontend/features/invoice-preview/invoice-preview-form.tsx` | Ensure preview/create uses current request state if needed |

## Summary
| Metric | Value |
|---|---:|
| Total tasks | 26 |
| Backend tasks | 15 |
| Frontend tasks | 7 |
| QA tasks | 4 |
| Estimated time | 9-11h |
| New files | 3 |
| Modified files | 11 |

## Tasks Overview
| ID | Title | Status | Estimate | Depends |
|---|---|---|---:|---|
| BE-REQ-001 | Fix SQL camelCase mapping | ✅ completed | 25m | - |
| BE-REQ-002 | Define saved/suggested response contract | ✅ completed | 20m | BE-REQ-001 |
| BE-REQ-003 | Add request normalize/sanitize helpers | ✅ completed | 45m | BE-REQ-002 |
| BE-REQ-004 | Add invoice request validation rules | ✅ completed | 50m | BE-REQ-003 |
| BE-PAN-001 | Extend Pancake buyer normalization | ✅ completed | 35m | BE-REQ-002 |
| BE-PAN-002 | Build suggested invoice request | ✅ completed | 50m | BE-PAN-001 |
| BE-PAN-003 | Add saved-or-suggested service helper | ✅ completed | 45m | BE-PAN-002 |
| BE-API-001 | Update GET request route | ✅ completed | 45m | BE-PAN-003 |
| BE-API-002 | Update PUT route normalize/validate | ✅ completed | 40m | BE-REQ-004, BE-API-001 |
| BE-API-003 | Enrich draft-status response | ✅ completed | 35m | BE-API-002 |
| BE-INV-001 | Preview uses saved/suggested request | ✅ completed | 45m | BE-API-001 |
| BE-INV-002 | Fix tax_rate inclusion by template code | ✅ completed | 35m | BE-INV-001 |
| BE-INV-003 | Compact buyer payload shape | ✅ completed | 45m | BE-INV-002 |
| BE-INV-004 | Add draft/create validation before enqueue | ✅ completed | 45m | BE-INV-003 |
| BE-INV-005 | Add issue guard for outdated/wrong company | ✅ completed | 50m | BE-INV-004 |
| FE-REQ-001 | Update invoice request client types | ✅ completed | 25m | BE-API-001 |
| FE-REQ-002 | Update draft status client type | ✅ completed | 20m | BE-API-003 |
| FE-FORM-001 | Populate form from saved/suggested response | ✅ completed | 40m | FE-REQ-001 |
| FE-FORM-002 | Add source badge and dirty state | ✅ completed | 35m | FE-FORM-001 |
| FE-FORM-003 | Add company/personal helper messages | ✅ completed | 30m | FE-FORM-002 |
| FE-FORM-004 | Show draft outdated warning | ✅ completed | 35m | FE-REQ-002, FE-FORM-002 |
| FE-FORM-005 | Save updates badge and dirty state | ✅ completed | 25m | FE-FORM-004 |
| QA-001 | Backend typecheck and API manual test | ✅ automated verified | 30m | BE-INV-005 |
| QA-002 | Frontend typecheck/build | ✅ automated verified | 30m | FE-FORM-005 |
| QA-003 | Manual E2E saved vs suggested | ✅ completed | 45m | QA-001, QA-002 |
| QA-004 | Manual E2E draft guards | ✅ completed | 45m | QA-003 |

## Execution Order
1. BE-REQ-001 → BE-REQ-004
2. BE-PAN-001 → BE-PAN-003
3. BE-API-001 → BE-API-003
4. BE-INV-001 → BE-INV-005
5. FE-REQ-001 → FE-REQ-002
6. FE-FORM-001 → FE-FORM-005
7. QA-001 → QA-004

## Parallelization
- After `BE-API-001`, frontend client typing can begin.
- `BE-INV-002` can be prepared after `BE-INV-001` stabilizes.
- QA backend/frontend checks can run separately after their task chains complete.

## Risks & Assumptions
- Pancake company fields may vary by shop; extraction must be defensive.
- GET route may become slower when no saved request exists because it fetches Pancake order.
- Existing drafts may become outdated once request data is corrected.
- Auto-detect company assumes MST/company info is a reliable signal.

## Verification Commands
```bash
cd backend
npm run typecheck
npm test
```

## Verification Results
| Check | Status | Notes |
|---|---|---|
| `cd backend && npm run typecheck` | ✅ pass | TypeScript backend compile check passed |
| `cd backend && npm test` | ✅ pass | 14 test files, 85 tests passed |
| `cd frontend && npm run typecheck` | ✅ pass | TypeScript frontend compile check passed |
| `cd frontend && npm run build` | ✅ pass | Next.js production build passed; existing workspace-root warning only |
| Manual/API E2E saved vs suggested | ✅ pass | Real Pancake order 40 returned `source=pancake`, then PUT saved and subsequent GET returned `source=saved` with SePay defaults |
| Manual/API E2E draft guards | ✅ pass | Created draft job for order 40, edited request, draft-status returned `outdated=true`; issue API blocked with `requiresDraftRecreate=true` |

```bash
cd frontend
npm run typecheck
npm run build
```

## Manual E2E
1. Open order with no saved `invoice_buyer_requests`.
2. Open invoice request form.
3. Verify source is `pancake` and fields are prefilled.
4. Save form.
5. Reload form.
6. Verify source is `saved` and saved data wins.
7. Switch to company and save valid MST/name/address.
8. Create draft.
9. Edit request after draft.
10. Verify draft outdated warning and issue block.

## Manual/API E2E Results
- Dev session: `/v1/auth/dev-login` succeeded.
- Shop: `259547b8-f507-48d6-aa52-5b43313cc203` (`diginno test`).
- Saved-over-suggested test order: `40`.
- Initial GET returned `source: pancake` with Pancake buyer data.
- PUT saved request returned `source: saved`, preserved user edits, and backend filled SePay defaults (`paymentMethod=TM/CK`, `templateCode=2`, `invoiceSeries=C26TSE`, `taxRate=10`).
- Subsequent GET returned `source: saved`, confirming saved data wins.
- Preview for order `40` succeeded and used saved buyer data.
- Draft job was created for guard validation, then request was edited.
- Draft status returned `outdated=true`, `requiresDraftRecreate=true`, and the expected Vietnamese warning message.
- Issue API was tested after temporarily setting the test job to `draft_created`; it blocked with `VALIDATION_ERROR` and `requiresDraftRecreate=true`.
- Test invoice/background jobs were restored to `cancelled` to prevent worker-side SePay calls.

## Task Files
- [BE-REQ-001](./tasks/BE-REQ-001.md)
- [BE-REQ-002](./tasks/BE-REQ-002.md)
- [BE-REQ-003](./tasks/BE-REQ-003.md)
- [BE-REQ-004](./tasks/BE-REQ-004.md)
- [BE-PAN-001](./tasks/BE-PAN-001.md)
- [BE-PAN-002](./tasks/BE-PAN-002.md)
- [BE-PAN-003](./tasks/BE-PAN-003.md)
- [BE-API-001](./tasks/BE-API-001.md)
- [BE-API-002](./tasks/BE-API-002.md)
- [BE-API-003](./tasks/BE-API-003.md)
- [BE-INV-001](./tasks/BE-INV-001.md)
- [BE-INV-002](./tasks/BE-INV-002.md)
- [BE-INV-003](./tasks/BE-INV-003.md)
- [BE-INV-004](./tasks/BE-INV-004.md)
- [BE-INV-005](./tasks/BE-INV-005.md)
- [FE-REQ-001](./tasks/FE-REQ-001.md)
- [FE-REQ-002](./tasks/FE-REQ-002.md)
- [FE-FORM-001](./tasks/FE-FORM-001.md)
- [FE-FORM-002](./tasks/FE-FORM-002.md)
- [FE-FORM-003](./tasks/FE-FORM-003.md)
- [FE-FORM-004](./tasks/FE-FORM-004.md)
- [FE-FORM-005](./tasks/FE-FORM-005.md)
- [QA-001](./tasks/QA-001.md)
- [QA-002](./tasks/QA-002.md)
- [QA-003](./tasks/QA-003.md)
- [QA-004](./tasks/QA-004.md)
