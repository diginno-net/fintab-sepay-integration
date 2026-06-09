# Plan: Pancake Order Detail + Product Sync + Accurate Invoice Mapping

## Overview

Dự án này bổ sung các tính năng để đảm bảo hóa đơn SePay được tạo chính xác từ dữ liệu Pancake.

## Goals

1. Hiển thị chi tiết đơn hàng đầy đủ từ Pancake.
2. Đồng bộ sản phẩm từ Pancake vào database nội bộ.
3. Cải thiện invoice mapper để ưu tiên đúng field từ Pancake.
4. Preview hóa đơn có cảnh báo dữ liệu thiếu/sai trước khi tạo draft.

## Constraints & Preferences

- Backend: Fastify + PostgreSQL + Zod + TypeScript
- Frontend: Next.js App Router + RSC + Tailwind CSS + `@phosphor-icons/react`
- Không tạo bảng orders mới (dùng live Pancake API)
- Product sync: upsert by tenant_id + source_product_code
- Không overwrite manual tax profile khi sync

## Current Issues

1. `/orders` chỉ hiển thị 4 cột, không link detail.
2. Invoice mapper đang lấy thiếu field từ Pancake response.
3. Chưa có sync sản phẩm từ Pancake.
4. Invoice preview chỉ show JSON raw.

## Implementation Order

1. Order detail page + field utilities
2. Improved invoice mapper (buyer/item mapping)
3. Product sync from Pancake (backend + UI)
4. Invoice preview readable UI
5. QA verification

## Files

### Backend

- `backend/src/modules/pancake/pancake-normalizers.ts` — Normalize Pancake nested fields
- `backend/src/modules/products/pancake-product-mapper.ts` — Map Pancake variation → internal product
- `backend/src/modules/products/pancake-product-sync.service.ts` — Sync service
- `backend/src/modules/products/products.routes.ts` — Add sync endpoint
- `backend/src/modules/invoices/invoice-mapper.ts` — Improved mapping
- `backend/src/modules/tax/tax-resolution.service.ts` — Match from variation_info

### Frontend

- `frontend/features/orders/api.ts` — Add getOrder
- `frontend/features/orders/order-field-utils.ts` — Extract buyer/payment/items
- `frontend/app/(platform)/orders/[orderId]/page.tsx` — Order detail page
- `frontend/features/orders/order-detail.tsx` — Detail sections UI
- `frontend/app/(platform)/orders/page.tsx` — Improved table
- `frontend/features/products/api.ts` — Sync API client
- `frontend/features/products/sync-pancake-products-button.tsx` — Sync button
- `frontend/app/(platform)/products/page.tsx` — Add sync button
- `frontend/features/invoice-preview/invoice-preview-summary.tsx` — Readable preview
- `frontend/features/invoice-preview/invoice-preview-form.tsx` — Better form

## Verification

```bash
# Backend
cd backend && npm run typecheck && npm test

# Frontend
cd frontend && npm run build && npm test
```

## Risks

- Pancake product API shape có thể khác với order item variation_info
- Một số product không có display_id hoặc barcode
- Tax mapping vẫn cần manual product tax profiles
