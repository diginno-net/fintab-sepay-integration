# FE-INV-001: Tạo InvoiceStatsBar Component

## Status
pending

## Description
Tạo InvoiceStatsBar - stats bar cho invoice page hiển thị 4 stats cards: Tổng đơn / Đã phát hành / Chờ xử lý / Lỗi. Sử dụng StatCard component.

## Files
- `frontend/features/invoices/invoice-stats-bar.tsx` (create)

## Acceptance Criteria
- [ ] 4 StatCards trong 1 row
- [ ] Gọi API để lấy stats counts
- [ ] Tone: neutral cho total, success cho issued, warning cho pending, danger cho failed
- [ ] Loading skeleton state
- [ ] TypeScript strict, no any

## Dependencies
FE-UI-001

## Estimate
1h
