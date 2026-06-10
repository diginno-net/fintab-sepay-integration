# Invoice UI Redesign Plan

## Overview

Redesign trải nghiệm hóa đơn điện tử theo hướng **operational invoice console** - phù hợp với nghiệp vụ kế toán/phát hành: giao diện ít màu, sidebar hẹp, card trắng viền xanh nhạt, bảng lớn, trạng thái rõ, thao tác nhanh.

## Reference Design

Tham khảo 3 màn hình thiết kế từ dự án khác:
- Header "Quản lý hóa đơn điện tử"
- Stats cards: Tổng đơn / Đã phát hành / Chờ xử lý / Lỗi
- Tabs trạng thái: Tất cả / Chưa tạo / Đã tạo nháp / Đã phát hành / Lỗi
- Table với columns: Đơn, Mã SePay, Mã hóa đơn, Luồng xử lý, Cập nhật, Lỗi, Thao tác
- 2-column form layout + right panel notes cho SePay settings

## Status

**✅ COMPLETED** - All phases implemented

## Phases Completed

### ✅ Phase 1: Foundation - UI Primitives
- StatCard component
- Tabs component
- DataTable component (sorting, selection)
- OrderPicker (searchable select)
- Button size variants (sm, md, lg)
- Select searchable variant

### ✅ Phase 2: Invoice List Redesign
- InvoiceStatsBar
- InvoiceFilters
- InvoiceTableRow với inline actions
- Redesign `/invoices` page với header "Quản lý hóa đơn điện tử"
- API: listInvoices với filters

### ✅ Phase 3: Invoice Preview + Job Detail
- Redesign InvoicePreviewForm với OrderPicker, ShopPicker
- Cải thiện InvoicePreviewSummary
- Timeline visualization cho InvoiceJobDetail
- Copy invoice number button

### ✅ Phase 4: Order → Invoice Flow
- OrderInvoiceActions trong order list
- Invoice status column trong orders table
- OrderInvoicePanel trong order detail
- Invoice tab trong order detail page

### ✅ Phase 5: Invoice Log View (màn 3 style)
- InvoiceLogTable component
- Redesign `/jobs` page với log view toggle

### ✅ Phase 6: SePay Settings Redesign (màn 2 style)
- SepaySettingsLayout 2-column
- Redesign sepay settings page
- Integration status card

### ✅ Phase 7: Polish
- Badge variants cho invoice-specific statuses
- MainNav labels update

## Files Created

### New Components
- `frontend/components/ui/stat-card.tsx`
- `frontend/components/ui/tabs.tsx`
- `frontend/components/ui/data-table.tsx`
- `frontend/components/ui/order-picker.tsx`
- `frontend/features/invoices/invoice-stats-bar.tsx`
- `frontend/features/invoices/invoice-table-row.tsx`
- `frontend/features/invoices/invoice-log-table.tsx`
- `frontend/features/invoices/invoice-filters.tsx`
- `frontend/features/orders/order-invoice-actions.tsx`
- `frontend/features/orders/order-invoice-panel.tsx`
- `frontend/features/shops/sepay-settings-layout.tsx`

### Modified Pages
- `frontend/app/(platform)/invoices/page.tsx`
- `frontend/app/(platform)/invoices/preview/page.tsx`
- `frontend/app/(platform)/jobs/page.tsx`
- `frontend/app/(platform)/orders/page.tsx`
- `frontend/app/(platform)/orders/[orderId]/page.tsx`
- `frontend/app/(platform)/orders/[orderId]/order-detail-page-client.tsx`
- `frontend/app/(platform)/shops/[shopId]/settings/sepay/page.tsx`

### Modified Components
- `frontend/components/forms/button.tsx` (size variants)
- `frontend/components/forms/select.tsx` (searchable variant)
- `frontend/components/status/badge.tsx` (invoice variants)
- `frontend/features/invoice-preview/invoice-preview-form.tsx` (full redesign)
- `frontend/features/invoice-preview/invoice-preview-summary.tsx` (layout improvements)
- `frontend/features/invoices/invoice-job-detail.tsx` (timeline visualization)
- `frontend/features/job-history/job-actions.tsx` (copy invoice number)
- `frontend/features/invoices/api.ts` (retry, refresh functions)
