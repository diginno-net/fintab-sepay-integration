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

## Business Notes From Review

### Paid Orders Only

Nghiệp vụ cần chốt: chỉ xuất hóa đơn cho đơn hàng Pancake đã thanh toán.

Hiện trạng code:

- Dashboard có suy luận `paymentStatus` từ `payment_status` và `money_to_collect`.
- Luồng tạo nháp/phát hành chưa chặn bắt buộc theo trạng thái thanh toán.
- Webhook automation hiện mới kiểm tra `order.status`, chưa kiểm tra paid/unpaid.

Yêu cầu cần implement:

- Tạo helper dùng chung để xác định đơn đã thanh toán từ Pancake order.
- Chặn `create-draft` nếu đơn chưa thanh toán hoặc không xác định được thanh toán.
- Re-check order hiện tại từ Pancake trước khi `issue` để tránh phát hành nhầm đơn chưa thanh toán.
- Webhook automation chỉ auto tạo nháp khi đơn đã thanh toán.
- UI phải disable hành động tạo nháp/phát hành với đơn chưa thanh toán và hiển thị lý do rõ ràng.

Điểm cần xác nhận sau: chính sách với đơn COD. Mặc định an toàn nên xem COD là chưa thanh toán cho tới khi `money_to_collect = 0` hoặc Pancake có field xác nhận đã thu tiền.

### Pancake Data Coverage

Order detail đã gọi `GET /shops/{SHOP_ID}/orders/{ORDER_ID}` khi preview/tạo hóa đơn. Product sync đã gọi `GET /shops/{SHOP_ID}/products/variations` có phân trang.

Nhưng mapper hiện chưa tận dụng đủ dữ liệu từ response Pancake:

- Chưa map `money_to_collect`, `total_price`, `total_price_after_sub_discount`, `total_discount` vào payload SePay.
- Chưa map `shipping_fee`, `surcharge`, `prepaid`, `cod` theo quy tắc hóa đơn.
- Chưa map item discount từ `discount_each_product` hoặc `total_discount` sang `discount_amount`/discount line.
- Chưa map `order_currency`; payload đang hardcode `VND`.
- Chưa map `reference_code`; SePay đang tự sinh mã, khó chống trùng theo đơn Pancake.
- Chưa fallback đầy đủ `customer.address` và `national_id`/CCCD theo field SePay.
- `normalizeOrderItems` chỉ đọc `order.items`; cần hỗ trợ thêm shape `order_items`, `products`, `variations` nếu Pancake trả khác.

### Product Tax Mapping

Đã có nền tảng tax mapping:

- `product_tax_profiles` lưu thuế theo sản phẩm/source product code.
- `shop_tax_defaults` lưu thuế mặc định theo shop.
- Mapper gọi `resolveTaxForOrderItem` cho từng item.
- Với template GTGT `1`, item gửi `tax_rate`; với hóa đơn bán hàng template `2`, mapper bỏ `tax_rate`.

Các phần còn thiếu để điều chỉnh hóa đơn theo sản phẩm tốt hơn:

- Fallback từ `variation_info.tax_rate` của Pancake khi chưa có tax profile thủ công.
- Lookup product/tax profile nên ưu tiên shop hiện tại để tránh trùng mã giữa nhiều shop.
- `is_tax_inclusive_price` đang được lưu nhưng chưa được dùng khi tính payload/giá.
- Cần bulk UI để chỉnh thuế cho nhiều sản phẩm nhanh hơn chỉnh từng sản phẩm.

### SePay Payload Fields To Add

Theo tài liệu SePay create invoice, các field cần cân nhắc bổ sung vào mapper:

- `reference_code`
- `total_amount`
- `buyer.national_id`
- `items.discount_amount`
- `items.discount_tax` nếu có quy tắc phần trăm rõ ràng
- `items.before_discount_and_tax_amount`
- dòng `line_type = 3` cho order-level discount
- dòng phí ship/phụ thu nếu nghiệp vụ yêu cầu thể hiện trên hóa đơn

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
