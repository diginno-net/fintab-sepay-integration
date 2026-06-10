# FE-UI-006: Thêm searchable select variant cho Select

## Status
pending

## Description
Mở rộng SelectInput component với searchable variant. Cần thiết cho OrderPicker và các dropdown filters.

## Files
- `frontend/components/forms/select.tsx` (modify)

## Acceptance Criteria
- [ ] Thêm searchable prop: boolean
- [ ] Khi searchable=true, hiển thị search input phía trên options
- [ ] Filter options theo search text
- [ ] Debounce search input
- [ ] Giữ nguyên existing functionality

## Dependencies
None (FE-UI-003 is optional)

## Estimate
1h
