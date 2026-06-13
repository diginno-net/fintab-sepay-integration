# Plan: Pancake Invoice Ops Dashboard

## Metadata
- **Feature slug**: `pancake-invoice-ops-dashboard`
- **Created**: 2026-06-11
- **Status**: mvp-implemented-basic-verified
- **Priority**: P0
- **Reference project**: `/Users/hangha/diginno/plugin wix/shichida-sepay-einvoice`
- **Depends on**: [`pancake-invoice-request-autofill`](../pancake-invoice-request-autofill/plan.md)

## Overview
Chuyển trải nghiệm vận hành hóa đơn từ job-centered sang order-centered giống Shichida: một màn `/invoices` hiển thị toàn bộ đơn Pancake kèm trạng thái hóa đơn, hành động phù hợp theo từng trạng thái, Thông tin HĐ inline/panel, batch actions và nền tảng automation.

## Implementation Status
- **Backend invoice-order read model**: completed
- **Backend order-level actions**: completed
- **Frontend `/invoices` order-centered MVP**: completed
- **Invoice request panel from row**: completed
- **Bulk action UI/API**: completed
- **Automation policy/settings/auto issue**: implemented-basic-verified via [`sepay-invoice-automation-settings`](../sepay-invoice-automation-settings/plan.md)
- **Webhook standard workflow refactor**: partial; policy is enforced, full removal of direct mapper usage remains future cleanup
- **Automated verification**: completed for typecheck/test/build
- **API smoke test**: completed for `GET /v1/invoice-orders`
- **Implemented on**: 2026-06-11

## Target User Flow
```text
User mở /invoices
→ thấy tổng đơn / đã phát hành / chờ xử lý / lỗi
→ lọc theo Chưa tạo / Đã tạo nháp / Đã phát hành / Lỗi / Cần xử lý
→ mỗi dòng order có payment status + invoice status
→ bấm Thông tin HĐ để kiểm tra/sửa buyer request
→ bấm Tạo nháp / Tạo lại nháp / Phát hành / Tải PDF/XML theo trạng thái
→ có thể batch tạo nháp/phát hành các đơn đủ điều kiện
```

## Technical Approach
Thêm backend read model `invoice-orders` để frontend không tự join dữ liệu phức tạp.

```text
Pancake orders
  + invoice_jobs
  + invoice_buyer_requests
  + draft status/hash
  + action eligibility
→ InvoiceOrderRow[] + stats
→ /invoices order-centered UI
```

Manual and batch actions use the standard workflow. Webhook automation now enforces the same automation policy, while full removal of direct mapper usage from the webhook path remains future cleanup:

```text
createInvoicePreview()
→ assertInvoiceRequestReadyForDraft()
→ createOrReuseDraftJob()
→ enqueueIssueJob()
```

## Why This Approach

### Alternatives Considered
| Option | Considered | Not chosen because |
|---|---:|---|
| Frontend tự join Pancake orders với invoice jobs | ✅ | Dễ N+1 API, logic trạng thái/action rải ở FE, khó đồng bộ với backend guard |
| Giữ `/invoices` là job list và chỉ polish UI | ✅ | Không giống Shichida, không hiển thị toàn bộ đơn chưa tạo hóa đơn |
| Thêm projection table ngay | ✅ | Chưa cần, tăng migration/consistency complexity |
| Backend realtime read model | ✅ | Phù hợp MVP, dùng batch DB query để tránh N+1 |

### Trade-offs
- ✅ Frontend đơn giản, render đúng trạng thái và action từ backend.
- ✅ Dễ kiểm soát eligibility và business rules ở một nơi.
- ✅ Không phá manual invoice engine hiện có.
- ✅ Làm nền cho automation/batch/webhook.
- ❌ GET `/v1/invoice-orders` phụ thuộc Pancake API realtime.
- ❌ Cần thiết kế DTO mới tương đối lớn.

## Files to Create/Modify

### New Backend Files
| File | Purpose |
|---|---|
| `backend/src/modules/invoices/invoice-order-status.ts` | Compute invoice status and action eligibility for each order row |
| `backend/src/modules/invoices/invoice-order-read.service.ts` | Build order-centered read model from Pancake + DB data |
| `backend/src/modules/invoices/invoice-workflow.service.ts` | Shared order-level create/issue workflow for manual/batch/webhook |
| `backend/src/modules/invoices/invoice-automation-policy.ts` | Pure automation policy evaluation |

### Modified Backend Files
| File | Changes |
|---|---|
| `backend/src/modules/invoices/invoice.routes.ts` | Add invoice-orders read/action routes or register new route helpers |
| `backend/src/modules/invoices/invoice-job.service.ts` | Add batch-friendly job lookup helpers if needed |
| `backend/src/modules/webhooks/webhook-automation.service.ts` | Apply automation policy to webhook auto-create; full workflow refactor remains future cleanup |
| `backend/src/modules/jobs/job-handlers.ts` | Add guarded auto-issue side effect after `draft_created` |
| `backend/src/modules/integrations/integrations.routes.ts` | Store automation settings in SePay config GET/PUT |

### New Frontend Files
| File | Purpose |
|---|---|
| `frontend/features/invoice-ops/api-client.ts` | Client API for invoice-order rows/actions/settings |
| `frontend/features/invoice-ops/invoice-ops-client.tsx` | Main client component for `/invoices` |
| `frontend/features/invoice-ops/invoice-order-stats.tsx` | Stats cards |
| `frontend/features/invoice-ops/invoice-order-filters.tsx` | Filters/tabs/search |
| `frontend/features/invoice-ops/invoice-order-table.tsx` | Table wrapper and selection state |
| `frontend/features/invoice-ops/invoice-order-row.tsx` | Individual order row |
| `frontend/features/invoice-ops/invoice-order-actions.tsx` | Row actions by invoice state |
| `frontend/features/invoice-ops/invoice-request-panel.tsx` | Inline/drawer panel wrapping existing `InvoiceRequestForm` |
| `frontend/features/sepay-config/sepay-config-form.tsx` | SePay automation settings UI inside existing SePay config form |

### Modified Frontend Files
| File | Changes |
|---|---|
| `frontend/app/(platform)/invoices/page.tsx` | Replace job-centered table with order-centered Invoice Ops page |
| `frontend/app/(platform)/jobs/page.tsx` | Reposition as technical processing log, copy update later |
| `frontend/app/(platform)/shops/[shopId]/settings/sepay/page.tsx` | Add automation settings section |
| `frontend/app/(platform)/shops/[shopId]/settings/webhook/page.tsx` | Replace placeholder with usable webhook/automation information |
| `frontend/components/navigation/main-nav.tsx` | Optional label/copy adjustment |
| `frontend/features/shop-switcher/shop-switcher.tsx` | Make shop switching affect URL/session in later polish phase |

## Summary
| Metric | Value |
|---|---:|
| Total tasks | 25 |
| Backend tasks | 11 |
| Frontend tasks | 11 |
| Automation tasks | 3 |
| QA tasks | 2 |
| Estimated time | 14-18h |
| New files | 13 |
| Modified files | 10+ |

## Task Overview
| ID | Title | Status | Estimate | Depends |
|---|---|---|---:|---|
| BE-OPS-001 | Define invoice order status/action model | ✅ completed | 45m | - |
| BE-OPS-002 | Add batch invoice job/buyer request lookup helpers | ✅ completed | 45m | BE-OPS-001 |
| BE-OPS-003 | Implement invoice order read service | ✅ completed | 1h | BE-OPS-002 |
| BE-OPS-004 | Add GET `/v1/invoice-orders` | ✅ completed | 45m | BE-OPS-003 |
| BE-OPS-005 | Implement order-level create draft workflow | ✅ completed | 50m | BE-OPS-004 |
| BE-OPS-006 | Implement order-level issue workflow | ✅ completed | 50m | BE-OPS-005 |
| BE-OPS-007 | Add bulk create draft endpoint | ✅ completed | 50m | BE-OPS-005 |
| BE-OPS-008 | Add bulk issue endpoint | ✅ completed | 50m | BE-OPS-006 |
| FE-OPS-001 | Add invoice ops API client/types | ✅ completed | 35m | BE-OPS-004 |
| FE-OPS-002 | Build stats component | ✅ completed | 35m | FE-OPS-001 |
| FE-OPS-003 | Build filters/search component | ✅ completed | 40m | FE-OPS-001 |
| FE-OPS-004 | Build invoice order table/row | ✅ completed | 1h | FE-OPS-002, FE-OPS-003 |
| FE-OPS-005 | Build row action component | ✅ completed | 50m | BE-OPS-006, FE-OPS-004 |
| FE-OPS-006 | Build invoice request panel | ✅ completed | 45m | FE-OPS-004 |
| FE-OPS-007 | Replace `/invoices` page with Invoice Ops UI | ✅ completed | 1h | FE-OPS-005, FE-OPS-006 |
| FE-OPS-008 | Add bulk selection/action bar | ✅ completed | 45m | BE-OPS-008, FE-OPS-007 |
| BE-AUTO-001 | Add automation policy service/routes | ✅ completed-basic | 1h | BE-OPS-006 |
| FE-AUTO-001 | Add automation settings form | ✅ completed-basic | 1h | BE-AUTO-001 |
| BE-AUTO-002 | Refactor webhook automation to standard workflow | ◐ partial | 1h | BE-AUTO-001, BE-OPS-005 |
| BE-AUTO-003 | Add guarded auto-issue after draft_created | ✅ completed | 1h | BE-AUTO-002, BE-OPS-006 |
| FE-POLISH-001 | Reposition Jobs page as technical log | ⏳ pending | 30m | FE-OPS-007 |
| FE-POLISH-002 | Replace webhook placeholder page | ⏳ pending | 45m | BE-AUTO-001 |
| FE-POLISH-003 | Make shop switcher update URL/session behavior | ⏳ pending | 45m | FE-OPS-007 |
| QA-001 | Backend typecheck/tests/API E2E | ✅ automated-pass | 1h | BE-AUTO-003 |
| QA-002 | Frontend typecheck/build/manual UI E2E | ✅ automated-pass | 1h | FE-POLISH-003 |

## Execution Phases

### Phase 1: Backend read model MVP
`BE-OPS-001` → `BE-OPS-004`

Goal: `/v1/invoice-orders` returns rows/stats for UI.

### Phase 2: Frontend order-centered `/invoices`
`FE-OPS-001` → `FE-OPS-007`

Goal: `/invoices` visually matches Shichida-style operations table.

### Phase 3: Order-level actions and bulk actions
`BE-OPS-005` → `BE-OPS-008`, then `FE-OPS-005`, `FE-OPS-008`

Goal: row/bulk actions work without frontend knowing job internals.

### Phase 4: Automation settings and webhook refactor
`BE-AUTO-001` → `FE-AUTO-001` → `BE-AUTO-002` → `BE-AUTO-003`

Goal: safe automation policy and standard workflow reuse.

### Phase 5: Polish and QA
`FE-POLISH-*`, `QA-*`

Goal: production-ready navigation/copy and verified flow.

## API Contracts

### `GET /v1/invoice-orders`
```text
Query:
- shopId: string required
- status: all | not_created | draft_created | issued | failed | processing | requires_attention optional
- search: string optional
- limit: number optional
```

```text
Response:
- stats: InvoiceOrderStats
- rows: InvoiceOrderRow[]
```

### `InvoiceOrderRow`
```text
- orderId
- orderNumber
- customerName
- customerEmail
- customerPhone
- totalAmount
- totalFormatted
- paymentStatus
- pancakeStatus
- pancakeStatusLabel
- invoiceStatus
- invoiceStatusLabel
- invoiceJobId
- invoiceNumber
- hasBuyerRequest
- buyerRequestSource
- requiresDraftRecreate
- eligibleForDraft
- eligibleForIssue
- eligibleForDownload
- eligibleForRetry
- errorMessage
- updatedAt
```

### Order-level actions
```http
POST /v1/invoice-orders/:shopId/:orderId/create-draft
POST /v1/invoice-orders/:shopId/:orderId/issue
POST /v1/invoice-orders/bulk-create-draft
POST /v1/invoice-orders/bulk-issue
```

## Risks & Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Pancake API slow | Slower `/invoices` | Limit page size, batch DB joins, add projection later if needed |
| Status mismatch between backend and frontend | Wrong actions visible | Backend returns eligibility flags and labels |
| Auto issue creates wrong invoices | High | Default autoIssue off, require confirmation, reuse `enqueueIssueJob` guards |
| Webhook bypasses manual rules | High | Refactor webhook to use `invoice-workflow.service.ts` |
| Duplicate jobs from bulk/webhook | Medium | Existing idempotency key + dedupe key reused |
| UI too complex in one page | Medium | Split features into small components under `invoice-ops/` |

## Verification

### Backend
```bash
cd backend
npm run typecheck
npm test
```

## Verification Results
| Check | Status | Notes |
|---|---|---|
| `cd backend && npm run typecheck` | ✅ pass | Backend TypeScript check passed |
| `cd backend && npm test` | ✅ pass | 14 test files, 85 tests passed |
| `cd frontend && npm run typecheck` | ✅ pass | Frontend TypeScript check passed |
| `cd frontend && npm run build` | ✅ pass | Next production build passed; existing workspace-root warning only |
| `GET /v1/invoice-orders?shopId=...&limit=5` | ✅ pass | Returned stats and rows for real Pancake shop |
| `/invoices` route smoke check | ✅ pass | Returned 200 and CSS asset returned 200 |
| Row create/issue/bulk manual mutation checks | ⏳ pending | Not run to avoid accidental SePay side effects during this pass |
| Automation policy/settings/auto issue | ✅ pass | Implemented in `sepay-invoice-automation-settings`; backend typecheck/tests and frontend typecheck/tests/build pass |
| Webhook full standard-workflow refactor | ◐ partial | Policy enforced; webhook still maps directly before enqueueing draft and can be cleaned up later |

Manual/API checks:
```text
GET /v1/invoice-orders?shopId=...
POST /v1/invoice-orders/:shopId/:orderId/create-draft
POST /v1/invoice-orders/:shopId/:orderId/issue
POST /v1/invoice-orders/bulk-issue
```

### Frontend
```bash
cd frontend
npm run typecheck
npm run build
```

Manual UI checks:
```text
1. Open /invoices.
2. Verify stats match rows.
3. Verify rows show not_created/draft_created/issued/failed states.
4. Open Thông tin HĐ panel and save request.
5. Create draft from row.
6. Issue draft from row.
7. Download PDF/XML when issued.
8. Use filters/tabs/search.
9. Use bulk issue for eligible rows.
10. Verify automation settings save/load.
```

## Out of Scope for MVP
- Persistent order projection table.
- Full scheduled sync engine.
- Advanced reconciliation with Pancake invoice_info_list.
- Multi-page pagination with cursor from Pancake, unless existing API already exposes it.

## Task Files
- [BE-OPS-001](./tasks/BE-OPS-001.md)
- [BE-OPS-002](./tasks/BE-OPS-002.md)
- [BE-OPS-003](./tasks/BE-OPS-003.md)
- [BE-OPS-004](./tasks/BE-OPS-004.md)
- [BE-OPS-005](./tasks/BE-OPS-005.md)
- [BE-OPS-006](./tasks/BE-OPS-006.md)
- [BE-OPS-007](./tasks/BE-OPS-007.md)
- [BE-OPS-008](./tasks/BE-OPS-008.md)
- [FE-OPS-001](./tasks/FE-OPS-001.md)
- [FE-OPS-002](./tasks/FE-OPS-002.md)
- [FE-OPS-003](./tasks/FE-OPS-003.md)
- [FE-OPS-004](./tasks/FE-OPS-004.md)
- [FE-OPS-005](./tasks/FE-OPS-005.md)
- [FE-OPS-006](./tasks/FE-OPS-006.md)
- [FE-OPS-007](./tasks/FE-OPS-007.md)
- [FE-OPS-008](./tasks/FE-OPS-008.md)
- [BE-AUTO-001](./tasks/BE-AUTO-001.md)
- [FE-AUTO-001](./tasks/FE-AUTO-001.md)
- [BE-AUTO-002](./tasks/BE-AUTO-002.md)
- [BE-AUTO-003](./tasks/BE-AUTO-003.md)
- [FE-POLISH-001](./tasks/FE-POLISH-001.md)
- [FE-POLISH-002](./tasks/FE-POLISH-002.md)
- [FE-POLISH-003](./tasks/FE-POLISH-003.md)
- [QA-001](./tasks/QA-001.md)
- [QA-002](./tasks/QA-002.md)
