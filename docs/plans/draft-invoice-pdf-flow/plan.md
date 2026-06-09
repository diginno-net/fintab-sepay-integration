# Plan: Draft Invoice PDF Flow

## Metadata
- **Feature slug**: `draft-invoice-pdf-flow`
- **Created**: 2026-06-09
- **Status**: implemented-foundation
- **Priority**: P0
- **Extended by**: [`sepay-shichida-port`](../sepay-shichida-port/plan.md)

## Documentation Sync Note
This plan established the baseline invoice-job UI, worker compatibility, retry behavior, and initial PDF actions. The follow-up plan [`sepay-shichida-port`](../sepay-shichida-port/plan.md) is now the source of truth for the next SePay implementation phase because it incorporates proven production-hardening patterns from the successful Shichida Wix project:

- SePay token envelope compatibility.
- Provider account picker and template/series selection.
- Payload `provider_account_id` and `invoice_series` injection.
- Provider/template/series validation before draft creation.
- Short-poll create/issue flows.
- Refresh invoice endpoint.
- Backend-normalized PDF/XML downloads.
- Friendly error next actions.

## Overview
Hoàn thiện flow tạo hóa đơn nháp từ Pancake order, theo dõi trạng thái SePay, phát hành hóa đơn và xem/tải PDF. Plan này sửa các điểm lệch hiện tại giữa `invoice_jobs`, `background_jobs`, worker và UI `/jobs`.

## Technical Approach
Chuẩn hóa thành 2 tầng rõ ràng:

1. **Invoice Job Layer**: bảng `invoice_jobs` là source of truth nghiệp vụ hóa đơn, dùng cho UI chính và các action như check status, issue, download.
2. **Background Job Layer**: bảng `background_jobs` chỉ phục vụ worker xử lý async task và debug queue.

Frontend mở chi tiết hóa đơn theo `invoiceJobId`. Background job vẫn xem được bằng `jobId`, nhưng không dùng background job id cho thao tác hóa đơn.

## 💡 Tại sao chọn approach này?

### Alternatives đã xem xét
| Option | Đã xét | Không chọn vì |
|---|---:|---|
| Chỉ dùng `/jobs` cho `background_jobs` | ✅ | Không đủ thông tin nghiệp vụ hóa đơn như reference code, invoice number, payload, PDF |
| Gộp `background_jobs` và `invoice_jobs` | ✅ | Phá cấu trúc hiện tại, rủi ro lớn, không cần migration để đạt mục tiêu |
| Tạo route mới `/invoices/jobs/[id]` | ✅ | Sạch hơn dài hạn nhưng tốn routing/UI nhiều hơn trong giai đoạn cần hoàn thiện nhanh |
| Mở rộng `/jobs?invoiceJobId=...` | ✅ | Phù hợp nhất với code hiện tại, ít sửa, dễ kiểm thử |

### Trade-offs của approach được chọn
- ✅ Pros: ít thay đổi routing, giữ được khả năng debug queue, tận dụng endpoints hiện có, không cần migration DB.
- ❌ Cons: `/jobs` có 2 mode nên cần UI phân biệt rõ invoice job và background job.

### Khi nào nên dùng approach khác?
| Nếu... | Thì dùng... |
|---|---|
| App có nhiều loại job kỹ thuật hơn | Tách `/queue/jobs` và `/invoices/jobs/[id]` |
| Người dùng cuối không cần thấy queue | Ẩn hoàn toàn `background_jobs` khỏi navigation |
| Cần audit hóa đơn riêng biệt | Tạo module invoice job detail riêng |

## Summary
| Metric | Value |
|---|---:|
| Total tasks | 7 |
| Estimated time | 4h 10m |
| Files affected | 11 |
| New files | 3 |
| DB migrations | 0 |

## Files to Create/Modify

### New Files
| File | Purpose |
|---|---|
| `frontend/features/invoices/download-artifact.ts` | Client helper xử lý response PDF từ SePay dưới nhiều format |
| `frontend/features/invoices/invoice-job-detail.tsx` | UI chi tiết invoice job, status, payload, warnings, action area |
| `frontend/features/jobs/background-job-detail.tsx` | UI chi tiết background job/debug queue tách khỏi page chính |

### Modified Files
| File | Changes |
|---|---|
| `backend/src/queue-worker.ts` | Worker nhận cả job type hiện tại và alias cũ cho create draft/issue/poll |
| `backend/src/modules/jobs/job-handlers.ts` | Chuẩn hóa status update và download behavior nếu cần |
| `frontend/app/(platform)/jobs/page.tsx` | Hỗ trợ `invoiceJobId` và `jobId`, render đúng detail component |
| `frontend/features/job-history/job-actions.tsx` | Check status, issue, view/download PDF dùng đúng invoice job id |
| `frontend/features/invoice-preview/invoice-preview-form.tsx` | Redirect rõ ràng tới invoice job detail sau create draft |
| `frontend/app/(platform)/invoices/page.tsx` | Link tới invoice job detail, hiển thị trạng thái dễ hiểu hơn |
| `frontend/tests/job-actions-smoke.test.tsx` | Update smoke tests cho actions mới |
| `docs/plans/00-overview.md` | Thêm active plan mới |

## Task Breakdown

### Phase 1: Backend worker correctness
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| BE-001 | Fix worker job type compatibility | `backend/src/queue-worker.ts` | 25m | - |
| BE-002 | Harden invoice job handlers for draft/issue/download | `backend/src/modules/jobs/job-handlers.ts` | 40m | BE-001 |

### Phase 2: Invoice job detail UI
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| FE-001 | Split jobs page into invoice-job and background-job modes | `frontend/app/(platform)/jobs/page.tsx`, `frontend/features/invoices/invoice-job-detail.tsx`, `frontend/features/jobs/background-job-detail.tsx` | 1h | - |
| FE-002 | Implement invoice actions and PDF helper | `frontend/features/job-history/job-actions.tsx`, `frontend/features/invoices/download-artifact.ts` | 1h | FE-001 |
| FE-003 | Fix links and redirects into invoice job detail | `frontend/features/invoice-preview/invoice-preview-form.tsx`, `frontend/app/(platform)/invoices/page.tsx` | 30m | FE-001 |

### Phase 3: Tests and verification
| ID | Task | Files | Estimate | Depends |
|---|---|---|---:|---|
| QA-001 | Update frontend smoke tests for JobActions | `frontend/tests/job-actions-smoke.test.tsx` | 35m | FE-002 |
| QA-002 | Run backend/frontend verification and manual E2E | no source files | 40m | BE-001, BE-002, FE-001, FE-002, FE-003, QA-001 |

## Execution Order
1. **Phase 1**: BE-001 → BE-002
2. **Phase 2**: FE-001 → FE-002 → FE-003
3. **Phase 3**: QA-001 → QA-002

## Task Files
- [BE-001](./tasks/BE-001.md)
- [BE-002](./tasks/BE-002.md)
- [FE-001](./tasks/FE-001.md)
- [FE-002](./tasks/FE-002.md)
- [FE-003](./tasks/FE-003.md)
- [QA-001](./tasks/QA-001.md)
- [QA-002](./tasks/QA-002.md)

## Target User Flow
1. User vào `/invoices/preview`.
2. Preview order Pancake.
3. Bấm `Create draft job`.
4. App redirect tới `/jobs?invoiceJobId=<invoice_jobs.id>`.
5. Worker tạo draft trên SePay.
6. User check status hoặc UI auto-refresh đến `draft_created`.
7. User xem/tải PDF bản nháp nếu SePay hỗ trợ.
8. User bấm `Issue` để phát hành.
9. User check status đến `issued`.
10. User xem/tải PDF hóa đơn chính thức.

## Risks & Assumptions
- SePay có thể không hỗ trợ tải PDF khi hóa đơn mới là draft. UI cần hiển thị lỗi rõ nếu provider từ chối.
- Response download của SePay có thể là URL, base64, hoặc JSON nested. Frontend helper cần xử lý linh hoạt.
- Worker phải được chạy riêng bằng `npm run dev:worker` trong môi trường dev.
- Không cần migration DB vì các bảng và endpoint chính đã tồn tại.

## 💡 Học được gì từ plan này?

### Patterns áp dụng
| Pattern | Tại sao dùng |
|---|---|
| Async Job Pattern | Tạo hóa đơn qua provider ngoài hệ thống cần retry/poll, không nên block request UI |
| State Machine | Hóa đơn chuyển trạng thái có thứ tự, dễ kiểm soát action hợp lệ |
| Idempotency | Một Pancake order chỉ có một invoice job để tránh duplicate hóa đơn |
| Adapter/Normalizer | PDF response từ provider có thể khác format, cần lớp xử lý trung gian |
| Separation of Concerns | `invoice_jobs` cho nghiệp vụ, `background_jobs` cho queue kỹ thuật |

### Architectural decisions
| Quyết định | Lý do | Alternative |
|---|---|---|
| Dùng `invoiceJobId` cho UI chính | User quan tâm hóa đơn, không quan tâm queue id | Dùng background job id |
| Giữ `/jobs?invoiceJobId=` | Ít sửa routing, nhanh hoàn thiện flow | Tạo `/invoices/jobs/[id]` |
| Worker support nhiều alias type | Không phá dữ liệu/job đã tạo trước đó | Migration update toàn bộ job type |
| Frontend xử lý nhiều dạng PDF | Chưa biết chắc provider trả format nào | Backend normalize response tuyệt đối |

## Verification Commands
```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run typecheck && npm run build
```

Manual E2E:
```text
/login/dev
/invoices/preview?orderId=42
Create draft job
/jobs?invoiceJobId=<id>
Check status
View PDF / Download PDF
Issue
Check status
Download final PDF
```
