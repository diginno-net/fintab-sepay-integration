# FE-UI-005: Thêm size variants cho Button

## Status
pending

## Description
Mở rộng Button component hiện có với size variants (sm, md, lg). Size sm cần thiết cho inline actions trong table rows.

## Files
- `frontend/components/forms/button.tsx` (modify)

## Acceptance Criteria
- [ ] Thêm size prop: sm | md | lg (default: md)
- [ ] sm: h-8, text-sm, px-3
- [ ] md: h-10, text-base, px-4
- [ ] lg: h-12, text-lg, px-6
- [ ] Icon-only variant với correct padding

## Dependencies
None

## Estimate
30m
