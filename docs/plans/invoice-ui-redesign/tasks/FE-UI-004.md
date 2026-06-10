# FE-UI-004: Tạo OrderPicker Component

## Status
pending

## Description
Tạo OrderPicker - searchable select cho việc chọn đơn hàng trong invoice preview form. Cho phép user tìm kiếm đơn hàng theo order ID hoặc customer name.

## Files
- `frontend/components/ui/order-picker.tsx` (create)

## Acceptance Criteria
- [ ] Searchable dropdown, gõ để filter
- [ ] Hiển thị: order ID, customer name, date, total
- [ ] Lazy load: call API khi user type (debounce 300ms)
- [ ] Handle loading, error, empty states
- [ ] Props: shopId, value, onChange, placeholder
- [ ] TypeScript strict, no any

## Dependencies
- FE-UI-003 (DataTable for internals)

## Estimate
2h
