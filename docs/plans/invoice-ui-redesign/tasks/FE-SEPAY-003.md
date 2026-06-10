# FE-SEPAY-003: Thêm Integration Status Card

## Status
pending

## Description
Thêm integration status card vào SepaySettingsLayout - hiển thị tình trạng kết nối SePay: connected/disconnected, last sync time, quota usage.

## Files
- `frontend/features/shops/sepay-settings-layout.tsx` (modify)

## Acceptance Criteria
- [ ] Status indicator (green dot = connected, red = disconnected)
- [ ] Last sync timestamp
- [ ] Quota usage (nếu có từ API)
- [ ] "Test Connection" button
- [ ] TypeScript strict, no any

## Dependencies
FE-SEPAY-002

## Estimate
1h
