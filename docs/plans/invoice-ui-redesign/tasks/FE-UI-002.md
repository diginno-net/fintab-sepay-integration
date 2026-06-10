# FE-UI-002: Tạo Tabs Component

## Status
pending

## Description
Tạo Tabs component cho status filtering kiểu màn 1 - Tabs: Tất cả / Chưa tạo / Đã tạo nháp / Đã phát hành / Lỗi. Style: tabs nằm ngang, active tab có underline emerald, inactive tabs màu neutral.

## Files
- `frontend/components/ui/tabs.tsx` (create)

## Acceptance Criteria
- [ ] Component nhận props: tabs (array of {id, label, count?}), activeTab, onTabChange
- [ ] Active tab hiển thị underline emerald
- [ ] Hỗ trợ count badge bên phải mỗi tab
- [ ] Keyboard navigation (arrow keys)
- [ ] TypeScript strict, no any

## Dependencies
None

## Estimate
1h
