# Task: FE-OPS-005 - Build invoice order row actions

## Metadata
- Status: completed
- Estimate: 50m
- Depends on: BE-OPS-006, FE-OPS-004

## Files to Modify
- `frontend/features/invoice-ops/invoice-order-actions.tsx` (CREATE)

## Description
Create row action buttons that call order-level APIs based on backend eligibility flags.

## Requirements
- Show `Thông tin HĐ` for all actionable rows.
- Show `Tạo nháp` when `canCreateDraft`.
- Show `Tạo lại nháp` when `canRecreateDraft`.
- Show `Phát hành` when `canIssue`.
- Show `Tải PDF` and `Tải XML` when download eligible.
- Show `Thử lại` for failed/retry-eligible rows.
- Show pending/disabled states for in-progress statuses.
- Refresh list after successful mutation.
- Surface API validation errors inline.

## Verification
```bash
cd frontend && npm run typecheck
```

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
