# FE-LOG-002: Redesign /jobs Page

## Status
pending

## Description
Redesign /jobs page với log view toggle - cho phép switch giữa job list view (hiện tại) và log-style invoice view (màn 3).

## Files
- `frontend/app/(platform)/jobs/page.tsx` (modify)

## Acceptance Criteria
- [ ] Toggle: "Jobs" | "Nhật ký hóa đơn"
- [ ] "Jobs" tab - giữ layout hiện tại (background jobs + invoice jobs)
- [ ] "Nhật ký hóa đơn" tab - hiển thị InvoiceLogTable
- [ ] TypeScript strict, no any

## Dependencies
FE-LOG-001

## Estimate
2h
