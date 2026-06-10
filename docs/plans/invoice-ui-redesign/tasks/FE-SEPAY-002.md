# FE-SEPAY-002: Redesign SePay Settings Page

## Status
pending

## Description
Redesign /shops/[shopId]/settings/sepay page theo màn 2. Layout 2 cột: form bên trái, notes + status bên phải. Sections: Môi trường, Hình thức thanh toán, Mã mẫu, Ký hiệu, Tài khoản phát hành, Thuế suất, Auto options.

## Files
- `frontend/app/(platform)/shops/[shopId]/settings/sepay/page.tsx` (modify)

## Acceptance Criteria
- [ ] Sử dụng SepaySettingsLayout
- [ ] 2-column layout với form fields bên trái
- [ ] Sticky right panel với: Lưu ý vận hành, Tình trạng tích hợp
- [ ] Integration status card (Sepay connected, last sync, quota)
- [ ] Sử dụng StatCard cho status indicators
- [ ] TypeScript strict, no any

## Dependencies
FE-SEPAY-001, FE-UI-001

## Estimate
3h
