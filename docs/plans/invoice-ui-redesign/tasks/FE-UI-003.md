# FE-UI-003: Tạo DataTable Component

## Status
pending

## Description
Tạo DataTable component với sorting, selection. Dùng cho invoice list table kiểu màn 1 và màn 3. Hỗ trợ: column headers sortable, checkbox selection, expandable rows, pagination controls.

## Files
- `frontend/components/ui/data-table.tsx` (create)

## Acceptance Criteria
- [ ] Props: columns (id, header, accessor, sortable?, cell?), data, selectable?, onSelectionChange?, sortable?, pagination?
- [ ] Sortable columns với arrow indicators
- [ ] Checkbox column cho multi-select
- [ ] Pagination: prev/next buttons, page info
- [ ] Expandable rows (optional)
- [ ] Loading state với skeleton
- [ ] Empty state
- [ ] TypeScript strict, no any

## Dependencies
None

## Estimate
2h
