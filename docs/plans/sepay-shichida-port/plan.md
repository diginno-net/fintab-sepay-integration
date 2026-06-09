# Plan: SePay Shichida Port

## Metadata
- **Feature slug**: `sepay-shichida-port`
- **Created**: 2026-06-09
- **Status**: ready
- **Priority**: P0
- **Reference project**: `/Users/hangha/diginno/plugin wix/shichida-sepay-einvoice`
- **Extends**: [`draft-invoice-pdf-flow`](../draft-invoice-pdf-flow/plan.md)

## Overview
Port các pattern đã chạy thành công từ dự án Wix/Velo `shichida-sepay-einvoice` sang platform Fastify/Next hiện tại. Mục tiêu là hoàn thiện flow SePay production-ready: token envelope compatibility, provider account picker, template/series validation, payload đầy đủ, create/issue short-poll, refresh invoice, và download PDF/XML ổn định.

## Current Gap Summary
| Area | Current project | Shichida reference | Required change |
|---|---|---|---|
| Token response | Đọc trực tiếp `access_token` | Đọc `data.access_token` | Support cả 2 shapes |
| Payload | Thiếu `provider_account_id`, `invoice_series` | Có đầy đủ config fields | Inject config vào invoice payload |
| Provider account | Nhập tay | Load accounts/templates từ SePay | Add picker UI + detail endpoint |
| Template validation | Chưa validate | Validate account/template/series | Validate before create draft |
| Draft/issue | Mostly manual poll | Short-poll sau create/issue | Improve job handlers |
| Refresh | Check status limited | Refresh create/issue/get invoice | Add refresh endpoint |
| Download | Frontend đoán response | Backend normalize PDF bytes/url | Normalize backend response |
| Error UX | Còn generic | Friendly next action | Error mapper + CTA |

## Technical Approach
Nâng cấp theo 4 lớp:

1. **SePay Client Compatibility**
   - Fix token envelope.
   - Normalize response shape.
   - Add `getInvoice` and raw/binary download.

2. **SePay Config & Provider Picker**
   - Load provider accounts.
   - Load account detail/templates.
   - Select/apply `provider_account_id`, `template_code`, `invoice_series`.

3. **Invoice Lifecycle**
   - Payload includes config fields.
   - Validate template/series before create.
   - Short-poll create/issue.
   - Refresh invoice from tracking/reference code.

4. **Download & UX**
   - Backend returns normalized PDF/XML artifact.
   - Frontend handles view/download consistently.
   - Errors include next action guidance.

## 💡 Tại sao chọn approach này?

### Alternatives đã xem xét
| Option | Đã xét | Không chọn vì |
|---|---:|---|
| Chỉ sửa token | ✅ | Payload/config/provider selection vẫn sai |
| Chỉ thêm provider picker | ✅ | Backend vẫn thiếu validation/refresh/download normalization |
| Copy nguyên Shichida code | ✅ | Shichida dùng Wix/Velo, project hiện tại dùng Fastify/Next/Postgres |
| Port patterns theo architecture hiện tại | ✅ | Giữ kiến trúc hiện có, dùng bài học đã production hardening |

### Trade-offs
- ✅ Dựa trên flow đã chạy thành công.
- ✅ Fix đúng gốc: credential, provider account, template/series, reference code, PDF.
- ✅ UX giảm nhập nhầm Pancake shop id thành provider account id.
- ❌ Nhiều task backend/frontend.
- ❌ Cần sandbox credentials thật để manual E2E đầy đủ.

### Khi nào dùng approach khác?
| Nếu... | Thì dùng... |
|---|---|
| Chỉ demo offline không gọi SePay | Mock SePay adapter |
| Muốn phát hành tự động hàng loạt production | Thêm production guard + approval workflow riêng |
| Nhiều provider hóa đơn ngoài SePay | Abstract provider adapter interface |

## Summary
| Metric | Value |
|---|---:|
| Total tasks | 23 |
| Backend tasks | 17 |
| Frontend tasks | 6 |
| QA tasks | 5 |
| Estimated time | 12-14h |
| DB migrations | Optional, nếu tách `pdf_url`/`xml_url` columns |

## Files to Create/Modify

### New Files
| File | Purpose |
|---|---|
| `backend/src/modules/sepay/sepay-response-utils.ts` | Extract/normalize tracking/reference/invoice/pdf/xml/status |
| `backend/src/modules/sepay/provider-template-rules.ts` | Validate provider account/template/series |
| `backend/src/modules/sepay/sepay-download.service.ts` | Normalize PDF/XML download response |
| `frontend/features/sepay-config/provider-account-picker.tsx` | Provider account + template picker UI |
| `frontend/features/invoices/invoice-error-messages.ts` | Friendly error mapping and next actions |

### Modified Files
| File | Changes |
|---|---|
| `backend/src/modules/sepay/sepay-einvoice-client.ts` | Token envelope, getInvoice, raw download |
| `backend/src/modules/sepay/sepay.service.ts` | Context/test/provider detail helpers |
| `backend/src/modules/invoices/invoice-mapper.ts` | Payload config fields |
| `backend/src/modules/invoices/invoice.service.ts` | Load SePay config for preview/create |
| `backend/src/modules/jobs/job-handlers.ts` | Validate, short-poll, refresh, normalized download |
| `backend/src/modules/invoices/invoice.routes.ts` | Add refresh endpoint |
| `backend/src/modules/integrations/integrations.routes.ts` | Add provider account detail endpoint |
| `frontend/features/sepay-config/sepay-config-form.tsx` | Provider picker and apply config |
| `frontend/features/job-history/job-actions.tsx` | Refresh and normalized download |
| `frontend/features/invoices/download-artifact.ts` | Consume normalized artifacts |
| `frontend/features/invoices/invoice-job-detail.tsx` | Better metadata and errors |

## Task Breakdown

### Phase 1: SePay Client Compatibility
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-001 | Fix SePay token envelope and response utilities | `backend/src/modules/sepay/sepay-einvoice-client.ts`, `backend/src/modules/sepay/sepay-response-utils.ts` | 45m | - |
| BE-002 | Add getInvoice and raw download support | `backend/src/modules/sepay/sepay-einvoice-client.ts` | 30m | BE-001 |
| BE-003 | Improve SePay context/test connection errors | `backend/src/modules/sepay/sepay.service.ts` | 35m | BE-001 |

### Phase 2: Provider Account + Template/Series Config
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-004 | Add provider account detail endpoint | `backend/src/modules/integrations/integrations.routes.ts`, `backend/src/modules/sepay/sepay.service.ts` | 35m | BE-002 |
| FE-001 | Build provider account picker UI | `frontend/features/sepay-config/provider-account-picker.tsx`, `frontend/features/sepay-config/sepay-config-form.tsx` | 1h | BE-004 |
| FE-002 | Apply provider/template/series into config form | `frontend/features/sepay-config/sepay-config-form.tsx` | 40m | FE-001 |

### Phase 3: Payload Config Injection
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-005 | Load SePay config for invoice preview/create | `backend/src/modules/invoices/invoice.service.ts`, `backend/src/modules/sepay/sepay.service.ts` | 40m | BE-003 |
| BE-006 | Inject provider_account_id and invoice_series into payload | `backend/src/modules/invoices/invoice-mapper.ts` | 45m | BE-005 |
| BE-007 | Respect default payment method and template config | `backend/src/modules/invoices/invoice-mapper.ts` | 30m | BE-006 |

### Phase 4: Template/Series Validation Before Draft
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-008 | Port provider-template validation helper | `backend/src/modules/sepay/provider-template-rules.ts` | 35m | BE-004 |
| BE-009 | Validate before create draft | `backend/src/modules/jobs/job-handlers.ts` | 30m | BE-008, BE-006 |

### Phase 5: Create Draft / Issue Short-Poll
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-010 | Short-poll create draft | `backend/src/modules/jobs/job-handlers.ts` | 50m | BE-009 |
| BE-011 | Short-poll issue invoice | `backend/src/modules/jobs/job-handlers.ts` | 45m | BE-010 |
| BE-012 | Store pdf/xml url and invoice number | `backend/src/modules/invoices/invoice-job.service.ts`, `backend/src/modules/jobs/job-handlers.ts` | 45m | BE-011 |

### Phase 6: Refresh Invoice Endpoint
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-013 | Add refresh handler | `backend/src/modules/jobs/job-handlers.ts` | 50m | BE-012 |
| BE-014 | Add refresh route | `backend/src/modules/invoices/invoice.routes.ts` | 20m | BE-013 |
| FE-003 | Replace/extend Check status with Refresh invoice | `frontend/features/job-history/job-actions.tsx` | 35m | BE-014 |

### Phase 7: Robust PDF/XML Download
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-015 | Implement normalized download service | `backend/src/modules/sepay/sepay-download.service.ts` | 1h | BE-002, BE-012 |
| BE-016 | Wire download service into endpoint | `backend/src/modules/jobs/job-handlers.ts` | 35m | BE-015 |
| FE-004 | Simplify artifact download helper | `frontend/features/invoices/download-artifact.ts`, `frontend/features/job-history/job-actions.tsx` | 40m | BE-016 |

### Phase 8: Friendly Error UX
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| FE-005 | Add invoice error message mapper | `frontend/features/invoices/invoice-error-messages.ts` | 30m | FE-003 |
| FE-006 | Show next-action UI in invoice detail | `frontend/features/invoices/invoice-job-detail.tsx`, `frontend/features/job-history/job-actions.tsx` | 45m | FE-005 |
| BE-017 | Standardize SePay error codes | `backend/src/modules/sepay/sepay.errors.ts`, `backend/src/modules/jobs/job-handlers.ts` | 35m | BE-009 |

### Phase 9: Tests & Verification
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| QA-001 | Backend tests for token/response utils | backend tests | 40m | BE-001 |
| QA-002 | Backend tests for provider template validation | backend tests | 35m | BE-008 |
| QA-003 | Backend tests for payload config injection | backend tests | 45m | BE-006 |
| QA-004 | Frontend tests for provider picker/actions | frontend tests | 45m | FE-001, FE-004 |
| QA-005 | Manual E2E with sandbox credentials | no source files | 1h | all |

## Execution Order
1. BE-001 → BE-002 → BE-003
2. BE-004 → FE-001 → FE-002
3. BE-005 → BE-006 → BE-007
4. BE-008 → BE-009
5. BE-010 → BE-011 → BE-012
6. BE-013 → BE-014 → FE-003
7. BE-015 → BE-016 → FE-004
8. FE-005 → FE-006 → BE-017
9. QA-001 → QA-005

## Task Files
- [BE-001](./tasks/BE-001.md)
- [BE-002](./tasks/BE-002.md)
- [BE-003](./tasks/BE-003.md)
- [BE-004](./tasks/BE-004.md)
- [FE-001](./tasks/FE-001.md)
- [FE-002](./tasks/FE-002.md)
- [BE-005](./tasks/BE-005.md)
- [BE-006](./tasks/BE-006.md)
- [BE-007](./tasks/BE-007.md)
- [BE-008](./tasks/BE-008.md)
- [BE-009](./tasks/BE-009.md)
- [BE-010](./tasks/BE-010.md)
- [BE-011](./tasks/BE-011.md)
- [BE-012](./tasks/BE-012.md)
- [BE-013](./tasks/BE-013.md)
- [BE-014](./tasks/BE-014.md)
- [FE-003](./tasks/FE-003.md)
- [BE-015](./tasks/BE-015.md)
- [BE-016](./tasks/BE-016.md)
- [FE-004](./tasks/FE-004.md)
- [FE-005](./tasks/FE-005.md)
- [FE-006](./tasks/FE-006.md)
- [BE-017](./tasks/BE-017.md)
- [QA-001](./tasks/QA-001.md)
- [QA-002](./tasks/QA-002.md)
- [QA-003](./tasks/QA-003.md)
- [QA-004](./tasks/QA-004.md)
- [QA-005](./tasks/QA-005.md)

## Verification Commands
```bash
cd backend
npm run typecheck
npm test
```

```bash
cd frontend
npm run typecheck
npm test
npm run build
```

## Manual E2E
```text
1. /login/dev
2. /shops/:shopId/settings/sepay
3. Enter client id/secret
4. Load provider accounts
5. Select provider account
6. Select template/series
7. Save config
8. Test SePay
9. /invoices/preview?orderId=42
10. Preview invoice
11. Create draft job
12. Worker creates draft
13. Refresh invoice until draft_created
14. View PDF
15. Issue
16. Refresh until issued
17. Download PDF/XML
```

## Risks & Assumptions
- Need real sandbox credentials to validate exact SePay response shape.
- Provider account template shape may vary; normalize multiple keys.
- Draft PDF may not exist before issue; UI must show refresh/issue guidance.
- Production should not reset/recreate invoices automatically.

## Learning Outcomes
| Pattern | Why used |
|---|---|
| Adapter/Normalizer | SePay responses vary by endpoint/env/provider |
| Provider Account Picker | Prevent user entering Pancake shop id as SePay account id |
| State Machine | Draft/issue/download actions depend on invoice status |
| Short Polling | Reduce manual refresh and stuck intermediate states |
| Backend Artifact Normalization | Frontend should not guess binary/url/base64 response format |
