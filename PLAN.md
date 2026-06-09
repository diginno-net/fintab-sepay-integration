# Fintab/Pancake POS x SePay eInvoice - Implementation Plan

## 1. Mục Tiêu

Xây dựng một backend/web admin để lấy dữ liệu đơn hàng và sản phẩm từ Pancake POS, phục vụ luồng Fintab đã đồng bộ sẵn, rồi xử lý phát hành hóa đơn điện tử qua SePay eInvoice.

Không xây trực tiếp trên Fintab ở giai đoạn đầu vì hiện chưa thấy API/plugin/webhook public riêng cho Fintab. Điểm tích hợp chính thức nên là Pancake POS Open API/Webhook.

## 2. Kiến Trúc Tổng Quan

```text
Pancake POS
  -> Open API / Webhook
  -> Backend Integration Service
  -> Invoice Mapper
  -> SePay eInvoice API
  -> Background Job Worker
  -> Job History / Audit Log
  -> Web Admin

Fintab
  <- tiếp tục nhận dữ liệu đồng bộ từ POS theo cấu hình sẵn
```

**Điểm khác biệt quan trọng với MVP:**
- API request chỉ enqueue job, không block HTTP 30-60s cho polling.
- Background worker xử lý create/poll/issue/poll.
- Frontend poll trạng thái qua jobs endpoint.

## 3. Nguồn Dữ Liệu Chính

### 3.1. Pancake POS Open API

```text
Base URL: https://pos.pages.fm/api/v1
Auth: api_key query parameter
Shop context: shop_id
```

Endpoint cần dùng:

```text
GET /shops/{SHOP_ID}/orders
GET /shops/{SHOP_ID}/orders/{ORDER_ID}
GET /shops/{SHOP_ID}/products/variations
GET /shops/{SHOP_ID}/products/{PRODUCT_SKU}
```

Webhook phase 2:

```text
PUT /shops/{SHOP_ID}
webhook_types: orders, products, variations_warehouses
```

### 3.2. SePay eInvoice API

```text
Sandbox Base URL: https://einvoice-api-sandbox.sepay.vn
Production Base URL: https://einvoice-api.sepay.vn
```

**Auth:**

```text
POST /v1/token
- Basic Auth: base64(client_id:client_secret)
- Body: empty
- Response: { access_token, token_type, expires_in: 86400 }
- Token TTL: 24 giờ
```

**11 Endpoints:**

```text
POST   /v1/token                                           # Lấy access token
GET    /v1/provider-accounts                              # Danh sách tài khoản NCC
GET    /v1/provider-accounts/{id}                         # Chi tiết tài khoản + templates
POST   /v1/invoices/create                                # Tạo hóa đơn (nháp/phát hành)
GET    /v1/invoices/create/check/{tracking_code}          # Check trạng thái tạo (async)
POST   /v1/invoices/issue                                 # Phát hành hóa đơn nháp
GET    /v1/invoices/issue/check/{tracking_code}           # Check trạng thái phát hành (async)
GET    /v1/invoices/{reference_code}                      # Chi tiết hóa đơn
GET    /v1/invoices                                       # Danh sách hóa đơn (pagination)
GET    /v1/usage                                          # Kiểm tra hạn ngạch
GET    /v1/invoices/{reference_code}/download?type=pdf|xml # Tải PDF/XML (base64)
```

**Lưu ý quan trọng:**

```text
Create và Issue đều xử lý ASYNC.
Sau khi gọi create/issue phải polling endpoint /check.
Polling khuyến nghị: 2-5 giây/lần, timeout 30-60 giây.
Hóa đơn nháp (is_draft=true) KHÔNG trừ hạn ngạch.
Phát hành chính thức mới trừ hạn ngạch.
```

## 4. MVP Scope

1. Cấu hình Pancake POS API key và shop ID.
2. Cấu hình SePay client ID/client secret, provider account, template, invoice series.
3. Tải danh sách đơn hàng Pancake POS.
4. Tải chi tiết đơn hàng.
5. Preview mapping sang payload SePay.
6. Tạo hóa đơn nháp qua background job.
7. Phát hành hóa đơn nháp qua background job.
8. Lưu lịch sử phát hành.
9. Chống phát hành trùng theo `source_order_id`.
10. Có web admin đơn giản để thao tác.
11. Hỗ trợ cả hóa đơn GTGT (template_code=1) và hóa đơn bán hàng (template_code=2).

**MVP Quyết Định:**

```text
- Background job xử lý async ngay từ đầu
- Hỗ trợ cả 2 loại hóa đơn: GTGT và bán hàng
- Luôn tạo nháp trước, user bấm phát hành sau
- Web admin riêng
```

## 5. Module Backend Dự Kiến

```text
src/
  app.js
  server.js

  config/
    env.js

  shared/
    http/
      error-handler.js
      validate.js
    auth/
      auth-middleware.js
      rbac-middleware.js
      permissions.js
    openapi/
      openapi.js
    queue/
      job-queue.js
      job-worker.js
    tenant/
      tenant-context.js
      tenant-guards.js
    observability/
      logger.js
      redaction.js
      correlation-id.js

  modules/
    identity/
      identity.routes.js
      identity.service.js

    tenant/
      tenant.routes.js
      tenant.service.js
      tenant-shop.service.js

    access-control/
      rbac.service.js
      permissions.js

    pancake/
      pancake-client.js
      pancake.routes.js
      pancake.service.js
      pancake-status-policy.js

    sepay/
      sepay-einvoice-client.js
      sepay.routes.js
      sepay.service.js
      sepay-token-cache.js

    invoices/
      invoice-mapper.js
      invoice.routes.js
      invoice.service.js
      invoice-job.service.js
      invoice-state-machine.js
      invoice-snapshot.service.js

    integrations/
      integrations.routes.js
      integrations.service.js
      secret.service.js

    products/
      product-import.service.js
      product-catalog.service.js
      product.routes.js

    tax/
      tax-profile.service.js
      tax-rule.service.js
      tax-resolution.service.js
      tax.routes.js

    jobs/
      jobs.routes.js
      jobs.service.js
      job-handlers.js

    webhooks/
      pancake-webhook.routes.js
      webhook-inbox.service.js

    audit/
      audit.service.js
```

**Boundary bắt buộc:**

```text
identity/tenant/access-control là nền tảng, phải scaffold trước integration.
pancake/sepay chỉ gọi external provider, không quyết định nghiệp vụ hóa đơn.
invoices giữ state machine, mapping, idempotency và snapshot.
jobs chỉ xử lý execution queue, retry, polling, locking.
webhooks luôn đi qua inbox/dedupe trước khi enqueue job.
audit nhận event từ mọi module, không chứa business logic.
```

### 5.1. SePay eInvoice Client Methods

```text
SepayEInvoiceClient
  getToken()                              # Auto-cache, auto-renew 5 phút trước TTL
  listProviderAccounts({ page, perPage })
  getProviderAccount(accountId)
  createInvoice(invoiceData)               # is_draft mặc định true
  checkCreateStatus(trackingCode)
  createInvoiceAndWait(invoiceData, options)  # Tạo + auto-polling
  issueInvoice(referenceCode)
  checkIssueStatus(trackingCode)
  issueInvoiceAndWait(referenceCode, options) # Phát hành + auto-polling
  listInvoices({ page, perPage })
  getInvoice(referenceCode)
  downloadInvoice(referenceCode, type)     # pdf | xml, trả base64
  checkUsage()
  createAndIssue(invoiceData)              # Full flow: tạo nháp -> phát hành
```

**Production rule:** các method `createInvoiceAndWait`, `issueInvoiceAndWait`, `createAndIssue` chỉ dùng cho script/test nội bộ. HTTP API production luôn enqueue background job và trả `202 Accepted` kèm `job_id`.

**Source tham khảo:** `../sepay-einvoice/src/sepay-einvoice-client.js`

**Khi adapt vào production:**
- Bỏ console.log payload/response
- Thêm timeout cho fetch
- Thêm retry hợp lý cho network error
- Chuẩn hóa SepayError class
- Không log dữ liệu nhạy cảm
- Service layer ghi job/audit

### 5.2. Background Job Architecture

```text
┌──────────────┐    ┌──────────────┐    ┌────────────────┐
│ API Request  │ -> │ Enqueue Job  │ -> │ Job Queue DB   │
│ (fast, sync) │    │ (returns ID) │    │                │
└──────────────┘    └──────────────┘    └───────┬────────┘
                                                │
                           ┌───────────────────┼───────────────────┐
                           ▼                   ▼                   ▼
                    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                    │ Worker:     │      │ Worker:     │      │ Worker:     │
                    │ create_draft│      │ poll_create │      │ issue       │
                    │ + call API │      │ + update DB │      │ + call API  │
                    └─────────────┘      └─────────────┘      └─────────────┘
```

**Job Queue Model:**

```text
background_jobs:
  id
  tenant_id
  invoice_job_id                    # FK đến invoice_jobs
  type: create_draft | poll_create | issue | poll_issue | download
  status: queued | running | succeeded | failed | timeout | cancelled
  attempts
  max_attempts: 3
  run_after                          # timestamp
  locked_at
  locked_by                          # worker instance
  payload_json
  result_json
  last_error_json
  created_at
  updated_at
  completed_at
```

**Job Status Lifecycle cho Invoice:**

```text
pending
  -> mapping_previewed
  -> draft_create_queued
  -> draft_create_running
  -> draft_create_polling
  -> draft_created          # có reference_code, chờ issue
  -> issue_queued
  -> issue_running
  -> issue_polling
  -> issued                 # hoàn tất
  -> failed                 # có error_json
  -> timeout               # polling vượt max retries
  -> cancelled             # user hủy
```

## 6. Web Admin Dự Kiến

Dựa trên prototype `Pancake x SePay - HĐĐT Integration`, nhưng sửa theo hướng production:

```text
Tab Cấu hình
Tab Đơn hàng
Tab Sản phẩm
Tab Preview hóa đơn
Tab Phát hành HĐĐT
Tab Lịch sử jobs
```

Không lưu secret trong `localStorage`. Browser chỉ gọi backend bằng session/JWT. Backend giữ secrets.

### 6.1. Tab Cấu Hình SePay

```text
Env: sandbox | production
Client ID
Client Secret
[Test Connection] button
Provider Account selector (lấy từ GET /v1/provider-accounts)
Template selector: GTGT (1) | Bán hàng (2)
Invoice Series selector
Default payment method: TM | CK | TM/CK | KHAC
Default create mode: draft first
[Quota remaining] display
```

### 6.2. Tab Preview Hóa Đơn

```text
Buyer info: name, tax_code, address, email, phone
Items list với line_type
Shipping fee line
Discount line (line_type=3)
Payment method
Template / Invoice series
[Cảnh báo] nếu thiếu email/phone/tax_code/address
[Create Draft] button
```

### 6.3. Tab Phát Hành

```text
Trạng thái job: pending | polling | success | failed | timeout
[Create Draft] - enqueue background job
[Issue Draft] - enqueue background job
[Check Status] - poll latest status
[Download PDF] - nếu đã issued
[Download XML] - nếu đã issued
[Retry] - nếu failed
```

### 6.4. Tab Lịch Sử Jobs

```text
source_order_id
invoice_type (GTGT | Bán hàng)
status
reference_code
invoice_number
total_amount
created_by
issued_by
created_at
issued_at
error message
[Retry] [View Details]
```

## 7. API Backend P0

```text
GET  /v1/health
GET  /v1/openapi.json

POST /v1/auth/login
GET  /v1/me

GET  /v1/tenant-shops
POST /v1/tenant-shops
GET  /v1/tenant-shops/:shopId
PUT  /v1/tenant-shops/:shopId
POST /v1/tenant-shops/:shopId/test-pancake

POST /v1/integrations/sepay/test
PUT  /v1/integrations/sepay/config
GET  /v1/integrations/sepay/config
GET  /v1/integrations/sepay/provider-accounts
GET  /v1/integrations/sepay/usage

GET  /v1/pancake/shops/:shopId/orders
GET  /v1/pancake/shops/:shopId/orders/:orderId
GET  /v1/pancake/shops/:shopId/products

POST /v1/products/import
GET  /v1/products
GET  /v1/products/lookup/:code

POST /v1/invoices/preview
POST /v1/invoices/create-draft
POST /v1/invoices/issue
GET  /v1/invoices/jobs
GET  /v1/invoices/jobs/:jobId
```

## 8. API Backend P1

```text
POST /v1/webhooks/pancake
POST /v1/tenant-shops/:shopId/configure-webhook
POST /v1/invoices/jobs/:jobId/retry
POST /v1/invoices/jobs/:jobId/check-status
GET  /v1/invoices/jobs/:jobId/download-pdf
GET  /v1/invoices/jobs/:jobId/download-xml
GET  /v1/audit-logs

GET  /v1/sepay/invoices
GET  /v1/sepay/invoices/:referenceCode
```

## 9. Auth + RBAC

Roles:

```text
owner
admin
accountant
operator
viewer
```

Permissions:

```text
tenant:read
tenant:write
tenant_shop:read
tenant_shop:write
integration:read
integration:write
orders:read
products:read
products:import
invoice:preview
invoice:create
invoice:issue
invoice:download
jobs:read
jobs:retry
webhook:configure
webhook:read
audit:read
```

Quyền đề xuất:

```text
viewer: xem đơn, xem job
operator: xem đơn, preview hóa đơn
accountant: preview, tạo nháp, phát hành, tải hóa đơn
admin: cấu hình integration, phát hành, retry
owner: toàn quyền
```

## 10. Bảo Mật

Client không được gửi actor fields:

```text
actor_id
user_id
created_by
updated_by
issued_by
tenant_id
shop_owner_id
```

Backend tự lấy từ auth context:

```text
actorId = req.user.id
tenantId = req.user.tenantId
```

Không gửi secrets từ browser:

```text
pancake_api_key
sepay_client_secret
sepay_access_token
sepay_token_expiry
```

Secrets lưu backend và phải mã hóa at-rest ngay từ MVP nếu lưu vào database.

**SePay Token bảo mật:**

```text
access_token chỉ lưu backend, không trả về frontend.
Token cache trong memory/service, có expiry tracking.
Khi 401: clear cache, retry 1 lần, nếu fail thì báo lỗi.
```

## 11. Data Model Tối Thiểu

```text
users
tenants
memberships
roles / role_permissions
tenant_shops
integration_configs
products
product_tax_profiles
shop_tax_defaults
background_jobs
invoice_jobs
invoice_mappings
invoice_payload_snapshots
webhook_inbox
audit_logs
sepay_token_cache
```

### 11.0. `tenant_shops`

```text
id
tenant_id
provider: pancake
external_shop_id                 # Pancake SHOP_ID
shop_name
status: active | inactive
config_json
encrypted_secret_json            # api_key, webhook_secret
created_at
updated_at
```

**Unique:**

```text
tenant_id + provider + external_shop_id
```

### 11.1. `integration_configs`

```text
id
tenant_id
tenant_shop_id nullable           # null = tenant-level default, not null = shop override
provider: sepay | pancake
scope: tenant | shop
config_json
encrypted_secret_json
created_at
updated_at
```

**Config resolution rule:**

Production bắt buộc: SePay config phải có tenant_shop_id. Nghĩa là mỗi shop phải có SePay config riêng. Không dùng tenant-level fallback cho việc phát hành hóa đơn production.

Sandbox/development: có thể dùng tenant-level config làm template/default để onboard nhanh, nhưng khi issue production phải có shop-level config.

Nếu Pancake config đã nằm trong `tenant_shops`, `integration_configs` chỉ nên dùng cho SePay và provider mở rộng sau này để tránh trùng ý nghĩa.

**SePay config_json:**

```text
{
  "env": "sandbox",
  "provider_account_id": "uuid",
  "template_code": "2",
  "invoice_series": "C25HTV",
  "default_payment_method": "TM/CK",
  "default_currency": "VND",
  "default_is_draft": true
}
```

**SePay encrypted_secret_json:**

```text
{
  "client_id": "...",
  "client_secret": "...",
  "access_token": "...",
  "token_expiry": "..."
}
```

### 11.2. `invoice_jobs`

```text
id
tenant_id
tenant_shop_id
source: pancake_pos
source_order_id
source_order_display_id
source_order_status
source_order_snapshot_json        # immutable snapshot tại thời điểm preview/create

invoice_type: gtgt | ban_hang
idempotency_key

sepay_provider_account_id
sepay_template_code
sepay_invoice_series

sepay_create_tracking_code
sepay_issue_tracking_code
sepay_reference_code

invoice_number
invoice_status
issued_date
download_available
pdf_artifact_id nullable
xml_artifact_id nullable

total_before_tax
tax_amount
total_amount

request_payload_json           # chứa buyer, items - cân nhắc mask khi hiển thị
response_json
error_json
mapping_warnings_json

created_by
issued_by
created_at
updated_at
issued_at
```

**Unique chống trùng:**

```text
MVP, 1 Pancake order chỉ được xuất 1 hóa đơn chính thức:
tenant_id + tenant_shop_id + source + source_order_id

Nếu sau này cho phép nhiều hóa đơn theo type/series/account:
tenant_id + tenant_shop_id + source + source_order_id + invoice_type + sepay_invoice_series
```

### 11.3. `background_jobs`

```text
id
tenant_id
tenant_shop_id nullable
invoice_job_id                # FK
type: create_draft | poll_create | issue | poll_issue | download
status: queued | running | succeeded | failed | timeout | cancelled
attempts
max_attempts: 3
poll_attempts
max_poll_attempts: 20
run_after
locked_at
locked_until
locked_by
dedupe_key
payload_json
result_json
last_error_json
dead_lettered_at
created_at
updated_at
completed_at
```

### 11.4. `webhook_inbox`

```text
id
tenant_id
tenant_shop_id
provider: pancake
event_type
external_event_id nullable
source_object_id                 # order_id/product_id/variation_id
source_updated_at nullable
payload_hash
headers_json                     # secret đã mask
payload_json
status: received | deduped | processed | failed
received_at
processed_at
error_json
created_at
updated_at
```

**Webhook dedupe:**

```text
tenant_shop_id + event_type + source_object_id + payload_hash
```

### 11.5. `audit_logs`

```text
id
tenant_id
tenant_shop_id nullable
actor_user_id nullable
actor_type: user | system | worker | webhook
action
resource_type
resource_id
permission
before_json nullable
after_json nullable
metadata_json
ip_address
user_agent
correlation_id
created_at
```

Audit bắt buộc cho: config secret/provider, test connection, preview, create draft, issue, retry, download, webhook receive/process, worker failure.

### 11.6. `sepay_token_cache`

```text
id
tenant_id
tenant_shop_id nullable
env: sandbox | production
client_id_hash
encrypted_access_token
expires_at
created_at
updated_at
```

Token cache in-memory chỉ phù hợp local/single instance. Production multi-worker cần cache dùng chung hoặc database-backed encrypted cache.

## 12. Mapping Pancake POS Order -> SePay Invoice

### 12.1. Pancake Fields

```text
order.id/display_id/custom_id
bill_full_name
bill_phone_number
bill_email
shipping_address.full_address
items[]
shipping_fee
discount
total_discount
surcharge
tax
cash
transfer_money
cod
```

### 12.2. SePay Fields

```text
template_code
invoice_series
issued_date
currency
provider_account_id
payment_method
buyer
items
notes
is_draft
```

### 12.3. Invoice Types

```text
template_code = "1": Hóa đơn GTGT (VAT)
- Item line_type 1 và 3 nên có tax_rate
- tax_rate hợp lệ: -2, -1, 0, 5, 8, 10
- Bắt buộc có buyer.tax_code cho doanh nghiệp

template_code = "2": Hóa đơn bán hàng
- Không bắt buộc tax_rate
- Phù hợp bán lẻ / POS
- Buyer có thể là cá nhân không cần MST
```

**Mapping invoice_type:**

```text
Pancake order không có tax info riêng
-> Web admin cho user chọn loại hóa đơn khi preview
-> Lưu vào invoice_jobs.invoice_type
```

### 12.4. Field Mapping

```text
bill_full_name -> buyer.name
bill_email -> buyer.email
bill_phone_number -> buyer.phone
shipping_address.full_address -> buyer.address

items[].product_id / variation_id / barcode -> item_code
items[].name / variation_info.name -> item_name
items[].quantity -> quantity
items[].unit_price / variation_info.price -> unit_price
```

### 12.5. Line Types

```text
line_type = 1:
- Hàng hóa / dịch vụ thông thường
- Cần: item_name, quantity, unit_price
- Tùy chọn: item_code, unit, tax_rate, discount_tax, discount_amount

line_type = 2:
- Hàng khuyến mại
- unit_price = 0
- Cần: item_name, quantity

line_type = 3:
- Chiết khấu thương mại trên tổng đơn
- Cần: item_name, before_discount_and_tax_amount
- Tùy chọn: tax_rate
- Không cần unit_price

line_type = 4:
- Ghi chú hiển thị trên hóa đơn
- Chỉ cần item_name
- Không có giá trị
```

### 12.6. Shipping Fee Mapping

```text
shipping_fee > 0
-> item_name: "Phí vận chuyển"
-> line_type: 1
-> unit: "lần" hoặc "đơn vị"
-> quantity: 1
-> unit_price: shipping_fee
```

### 12.7. Discount Mapping

```text
discount / total_discount > 0
-> line_type: 3
-> item_name: "Chiết khấu đơn hàng" hoặc "Chiết khấu thương mại"
-> before_discount_and_tax_amount: discount amount
-> tax_rate: 0 (không chịu thuế) hoặc giữ nguyên tax_rate của đơn
```

### 12.8. Promotion Item Mapping

```text
items[].unit_price = 0 và là hàng tặng
-> line_type: 2
-> item_name: ghi rõ "TẶNG: ..."
```

### 12.9. Payment Method Mapping

```text
transfer_money > 0 và cash = 0:
-> payment_method = "CK"

cash > 0 và transfer_money = 0:
-> payment_method = "TM"

cash > 0 và transfer_money > 0:
-> payment_method = "TM/CK"

cod > 0:
-> payment_method = "TM/CK" hoặc "KHAC" tùy config

Fallback:
-> payment_method = configured default (đề xuất "TM/CK")
```

### 12.10. Tax Rate Mapping

```text
Hóa đơn GTGT (template_code="1"):
- Mỗi item line_type 1 nên có tax_rate
- tax_rate hợp lệ: -2, -1, 0, 5, 8, 10

Ý nghĩa:
- -2: Không chịu thuế
- -1: Không kê khai, tính nộp thuế GTGT
- 0: 0% thuế suất
- 5: 5% thuế suất
- 8: 8% thuế suất ưu đãi
- 10: 10% thuế suất mặc định

Hóa đơn bán hàng (template_code="2"):
- Không cần tax_rate
- Nếu có cũng được bỏ qua
```

Tax rate không nên hardcode theo order. Tax phải được resolve theo thứ tự:

```text
1. product_tax_profiles theo tenant_shop_id + product_code
2. product_tax_profiles theo tenant_id + product_code (default toàn tenant)
3. shop_tax_defaults theo tenant_shop_id
4. warning hoặc block tùy unknown_product_policy
```

MVP policy đề xuất:

```text
unknown_product_policy = warn
-> dùng default_tax_rate của shop
-> hiển thị warning ở invoice preview
-> accountant được sửa tax_rate trước khi create draft
```

### 12.11. SePay Invoice Payload Schema

```text
{
  "template_code": "1" | "2",
  "invoice_series": "C25HTV",
  "issued_date": "2026-01-15 10:00:00",
  "currency": "VND",
  "provider_account_id": "uuid",
  "payment_method": "TM" | "CK" | "TM/CK" | "KHAC",
  "is_draft": true,
  "buyer": {
    "type": "personal" | "company",
    "name": "...",
    "legal_name": "...",
    "tax_code": "...",
    "address": "...",
    "email": "...",
    "phone": "...",
    "buyer_code": "...",
    "national_id": "..."
  },
  "items": [
    {
      "line_number": 1,
      "line_type": 1 | 2 | 3 | 4,
      "item_code": "...",
      "item_name": "...",
      "unit": "...",
      "quantity": 1,
      "unit_price": 100000,
      "tax_rate": 10,              // chỉ cho GTGT
      "discount_tax": 10,          // % chiết khấu
      "discount_amount": 5000,      // số tiền chiết khấu cố định
      "before_discount_and_tax_amount": 100000  // cho line_type=3
    }
  ],
  "notes": "..."
}
```

## 12B. Product Catalog

### 12B.1. Nguồn Dữ Liệu Sản Phẩm

```text
Pancake POS / Fintab export:
- File: products_export_YYYY-MM-DD.xlsx
- Sheet: Products
- Columns: Loại, Tên hàng hoá, Mã hàng hoá, Đơn vị tính, Cho phép xuất âm,
            Mã nhóm hàng hoá, Nhóm hàng hoá, Mã kho, Nhóm ngành nghề,
            Thuế tiêu thụ đặc biệt, Trạng thái
- 143 sản phẩm mẫu, 11 cột
```

**Thực tế từ file mẫu:**

```text
- 143 sản phẩm duy nhất, 0 trùng mã
- Loại: tất cả "Hàng hoá"
- Đơn vị tính: tất cả "ĐVT cơ bản"
- Trạng thái: tất cả "Đang hoạt động"
- Mã kho: 100% trống
- Thuế tiêu thụ đặc biệt: 100% trống
- Nhóm ngành nghề: tất cả "Phân phối, cung cấp hàng hoá"
- 20 nhóm hàng hoá khác nhau
```

**Trường hợp sử dụng:**

```text
1. Product Reference/Catalog - đối chiếu khi map items từ order
2. Item lookup theo Mã hàng hoá khi tạo invoice
3. Product group để filter/group trong web admin
```

### 12B.2. Product Data Model

```text
products:
  id
  tenant_id
  source: fintab_export | pancake_pos
  source_product_code              # Mã hàng hoá - dùng làm SKU
  product_name                     # Tên hàng hoá
  product_type                     # Loại (Hàng hoá | Dịch vụ | Combo)
  unit                             # Đơn vị tính
  default_invoice_unit             # Đơn vị khi xuất hóa đơn (fallback "cái")
  allow_negative_stock             # Cho phép xuất âm (0|1 -> boolean)
  group_code                       # Mã nhóm hàng hoá
  group_name                       # Nhóm hàng hoá
  warehouse_code                   # Mã kho (nullable)
  business_category                # Nhóm ngành nghề
  excise_tax                       # Thuế tiêu thụ đặc biệt (nullable)
  status                           # Đang hoạt động | Ngừng hoạt động
raw_json                         # JSON gốc từ export để trace
created_at
updated_at
```

### 12B.2A. Product Tax Profile Data Model

Scope này chỉ phục vụ map sản phẩm ra hóa đơn đúng thuế. Không sinh bút toán kế toán trong MVP.

```text
product_tax_profiles:
  id
  tenant_id
  tenant_shop_id nullable          # null = default toàn tenant, not null = override theo shop
  product_id nullable              # FK products nếu đã match catalog
  source_product_code              # SKU/Mã hàng hóa/barcode dùng để match order item
  product_name_snapshot
  tax_rate: -2 | -1 | 0 | 5 | 8 | 10
  tax_category: taxable | non_taxable | non_declarable | zero_rated
  invoice_line_type: 1 | 2 | 3 | 4
  invoice_unit
  is_tax_inclusive_price
  effective_from nullable
  effective_to nullable
  created_at
  updated_at
```

```text
shop_tax_defaults:
  id
  tenant_id
  tenant_shop_id
  default_tax_rate: -2 | -1 | 0 | 5 | 8 | 10
  default_invoice_unit
  default_invoice_type: gtgt | ban_hang
  unknown_product_policy: warn | block | use_default
  created_at
  updated_at
```

**Indexes:**

```text
unique product_tax_profiles: tenant_id + tenant_shop_id + source_product_code
index product_tax_profiles: tenant_id + source_product_code
unique shop_tax_defaults: tenant_id + tenant_shop_id
```

**Indexes:**

```text
unique: tenant_id + source + source_product_code
index: tenant_id + status
index: tenant_id + group_code
index: tenant_id + source
```

**Raw JSON nên lưu:**

```text
{
  "export_file": "products_export_2026-06-09.xlsx",
  "raw_row": { ... toàn bộ dòng gốc ... }
}
```

### 12B.3. Product Import Flow

```text
Admin upload file Fintab export (.xlsx)
-> backend parse Excel (openpyxl hoặc zipfile+xml)
-> validate header columns đúng format
-> normalize từng dòng sản phẩm
-> upsert theo tenant_id + source + source_product_code
-> lưu raw_json để trace lại dữ liệu gốc
-> trả kết quả import: inserted, updated, failed, skipped
-> hiển thị danh sách products trong admin
```

**Import validation:**

```text
- File phải có sheet "Products"
- Header phải chứa: Mã hàng hoá, Tên hàng hoá
- Mã hàng hoá không được trùng trong cùng tenant
- Mã hàng hoá không được rỗng
- Tên hàng hoá không được rỗng
```

### 12B.4. Product Mapping To SePay Invoice Item

```text
Khi tạo hóa đơn từ order, product lookup theo source_product_code:

product.source_product_code -> item_code
product.product_name      -> item_name
product.default_invoice_unit -> unit
tax_profile.tax_rate       -> tax_rate
tax_profile.invoice_line_type -> line_type
tax_profile.invoice_unit   -> unit override nếu có

Nếu không tìm thấy product:
-> dùng trực tiếp từ order item (barcode, name, price)
-> resolve tax theo shop_tax_defaults
-> log warning để admin biết sản phẩm chưa có trong catalog/tax profile
```

**Tax resolution service:**

```text
resolveTaxForOrderItem(orderItem, shopContext):
  1. Match product theo barcode/source_product_code/product_id/product_name
  2. Tìm product_tax_profile theo shop
  3. Nếu không có, tìm tenant-level tax profile
  4. Nếu vẫn không có, dùng shop_tax_defaults
  5. Nếu unknown_product_policy=block và thiếu profile -> block create draft
  6. Trả về tax_rate, line_type, invoice_unit, warnings
```

**Default Invoice Unit Rule:**

```text
Nếu unit = "ĐVT cơ bản" hoặc rỗng hoặc null
-> default_invoice_unit = "cái"

Giữ nguyên nếu có giá trị khác.
```

**Product Type Mapping:**

```text
Fintab "Hàng hoá" -> product_type = "goods"
Fintab "Dịch vụ"  -> product_type = "service"
Fintab "Combo"    -> product_type = "combo"
Khác              -> product_type = "goods" (default)
```

### 12B.5. Product Matching Strategy

```text
Khi order item có barcode / product_id từ Pancake:

1. Ưu tiên theo source_product_code (Mã hàng hoá)
   -> product.source_product_code = order_item.barcode

2. Fallback theo product_name ( fuzzy match )
   -> normalize name trước khi so sánh

3. Nếu không tìm thấy:
   -> tạo ad-hoc item từ order data
   -> không block việc tạo hóa đơn
   -> log warning

4. Nếu tìm thấy nhưng thông tin khác:
   -> dùng order item price/quantity (source of truth)
   -> dùng product catalog cho item_code và item_name
```

### 12B.6. Product API Endpoints

```text
POST   /v1/products/import           # Upload Excel import products
GET    /v1/products                  # List products (pagination, filter)
GET    /v1/products/:id              # Product detail
GET    /v1/products/lookup/:code     # Lookup by source_product_code
PUT    /v1/products/:id              # Update product
DELETE /v1/products/:id              # Soft delete (status = ngừng)

GET    /v1/products/:id/tax-profile
PUT    /v1/products/:id/tax-profile
GET    /v1/shops/:shopId/tax/defaults
PUT    /v1/shops/:shopId/tax/defaults
POST   /v1/products/tax-profiles/import
```

### 12B.7. Product Web Admin

```text
Tab Sản phẩm:
- Upload file Excel import
- Danh sách products (filter theo group, status)
- Tìm kiếm theo mã / tên
- Xem chi tiết product
- Sửa product info
- Cấu hình tax_rate/invoice_unit/line_type cho từng sản phẩm
- Bulk update thuế theo nhóm hàng hoặc import Excel tax profile
```

### 12B.8. Quyết Định Đã Chốt

```text
- Product Catalog dùng làm reference, không thay thế order data
- Import qua file Excel từ Fintab export
- Mã hàng hoá làm SKU chính
- Upsert theo tenant_id + source + source_product_code
- default_invoice_unit = "cái" khi unit = "ĐVT cơ bản"
- Raw JSON lưu để trace dữ liệu gốc
- Không tìm thấy product vẫn cho tạo hóa đơn, chỉ log warning
- Tax mapping là bắt buộc cho hóa đơn GTGT; nếu thiếu profile thì dùng default theo shop và warning ở preview
- Không làm accounting journal trong MVP; chỉ map thuế để xuất hóa đơn SePay đúng
```

## 12C. Tax Mapping Scope Cho Xuất Hóa Đơn

Mục tiêu của Tax Mapping là chuyển dữ liệu dòng hàng vận hành sang dòng hóa đơn đúng thuế.

```text
Pancake order item
-> Product Catalog match
-> Product Tax Profile
-> SePay invoice item: tax_rate, line_type, unit, warnings
```

Không nằm trong scope MVP này:

```text
- Không sinh bút toán kế toán
- Không post dữ liệu vào Fintab accounting API
- Không làm sổ cái, công nợ, giá vốn, tồn kho
```

Tax Mapping inputs cần có:

```text
- Product code/SKU/barcode
- Product name
- Product group
- Invoice unit
- VAT/tax rate
- Tax category
- Line type trên hóa đơn
```

Preview phải hiển thị rõ:

```text
- tax_rate được resolve từ đâu: product_profile | tenant_profile | shop_default | manual_override
- item nào thiếu tax profile
- item nào đang dùng default tax
- item nào có tax_rate không hợp lệ cho template GTGT
```

## 13. Luồng Preview

```text
User chọn order
-> backend lấy order detail từ Pancake
-> match product catalog theo barcode/product_code/name
-> resolve tax profile cho từng item
-> mapper sang SePay payload (theo invoice_type đã chọn)
-> validate
-> trả preview cho frontend
```

**Validation trước khi preview:**

```text
- buyer.name bắt buộc
- items có ít nhất 1 dòng
- line_type 1 cần item_name, quantity, unit_price
- line_type 3 cần item_name, before_discount_and_tax_amount
- template_code="1" thì items nên có tax_rate
- tax_rate phải nằm trong [-2, -1, 0, 5, 8, 10]
- nếu unknown_product_policy=block thì thiếu product_tax_profile phải block create draft
- nếu dùng default_tax_rate thì trả mapping warning để accountant review
- payment_method phải là TM|CK|TM/CK|KHAC
```

## 14. Luồng Tạo Nháp (Background Job)

```text
User bấm tạo nháp
-> validate RBAC invoice:create
-> validate tenant_shop_id và quyền truy cập shop
-> validate Pancake order status policy
-> validate tax mapping policy (block nếu thiếu tax profile và shop policy = block)
-> check idempotency (tenant_id + tenant_shop_id + source + source_order_id)
-> check Pancake order.einvoices hoặc invoice_info_list nếu có
-> lưu source_order_snapshot_json để payload create không lệch preview
-> tạo invoice_jobs record (status: pending)
-> enqueue background_jobs (type: create_draft, status: queued)
-> trả job_id/job_status về frontend NGAY
-> return 202 Accepted với { jobId, status: "queued" }

--- Background Worker ---
Worker lấy job từ queue
-> lấy tenant_shop + decrypt Pancake api_key
-> dùng source_order_snapshot_json nếu đã có, chỉ refetch khi user yêu cầu refresh
-> map payload SePay theo invoice_type
-> cập nhật invoice_jobs.status = draft_create_running
-> gọi SePay createInvoice(is_draft=true)
-> lưu sepay_create_tracking_code
-> enqueue poll_create job
-> return

Worker poll_create:
-> gọi SePay checkCreateStatus(tracking_code)
-> status = Pending: tiếp tục polling (tối đa 20 retries)
-> status = Success:
    -> lưu sepay_reference_code, invoice_status=draft
    -> lưu download_available nếu provider trả thông tin download
    -> cập nhật invoice_jobs.status = draft_created
    -> job status = succeeded
-> status = Failed:
    -> lưu error_json
    -> cập nhật invoice_jobs.status = failed
    -> job status = failed
-> vượt max retries:
    -> cập nhật invoice_jobs.status = timeout
    -> job status = timeout
```

## 15. Luồng Phát Hành (Background Job)

```text
User bấm phát hành
-> validate RBAC invoice:issue
-> nếu chưa có draft: enqueue create_draft trước, đợi hoàn tất
-> nếu đã draft: enqueue issue job
-> trả job_id/job_status về frontend NGAY
-> return 202 Accepted

--- Background Worker ---
Worker issue:
-> lấy reference_code từ invoice_jobs
-> cập nhật invoice_jobs.status = issue_running
-> gọi SePay issueInvoice(reference_code)
-> lưu sepay_issue_tracking_code
-> enqueue poll_issue job

Worker poll_issue:
-> gọi SePay checkIssueStatus(tracking_code)
-> status = Pending: tiếp tục polling (tối đa 20 retries)
-> status = Success:
    -> lưu invoice_number, issued_date
    -> lưu download_available=true, không lưu URL giả nếu SePay trả base64 qua endpoint download
    -> cập nhật invoice_jobs.status = issued
    -> cập nhật issued_at
    -> job status = succeeded
-> status = Failed:
    -> lưu error_json
    -> cập nhật invoice_jobs.status = failed
    -> job status = failed
-> vượt max retries:
    -> cập nhật invoice_jobs.status = timeout
    -> job status = timeout
```

## 16. Luồng Webhook Phase 2

```text
Pancake gửi order webhook
-> backend verify X-PANCAKE-WEBHOOK-SECRET theo từng tenant_shop
-> lưu webhook_inbox
-> dedupe theo tenant_shop_id + event_type + source_object_id + payload_hash
-> enqueue job nếu chưa trùng
-> nếu order thỏa điều kiện (đã thanh toán, chưa xuất HĐ):
  -> enqueue create_draft (hoặc issue tùy config)
  -> worker xử lý async
```

## 17. OpenAPI

Cần tạo OpenAPI cho:

```text
/v1/auth/*
/v1/integrations/*
/v1/pancake/*
/v1/products/*
/v1/sepay/*
/v1/invoices/*
/v1/jobs/*
/v1/webhooks/*
```

Mỗi endpoint cần có:

```text
security: bearerAuth
request schema
response schema
error schema
permission requirement
```

## 18. Tests P0

```text
Auth missing token -> 401
RBAC thiếu quyền invoice:issue -> 403
Client gửi actor_id -> bị ignore hoặc reject
Pancake order map đúng sang SePay invoice (GTGT và bán hàng)
Preview không gọi SePay
Mapper hỗ trợ template_code 1 và 2
GTGT item thiếu tax_rate -> validate warning
Shipping fee tạo line_type=1 đúng
Discount tạo line_type=3 đúng
Create draft enqueue background job -> trả 202 ngay
Poll create Success lưu reference_code
Issue enqueue background job -> trả 202 ngay
Poll issue Success lưu invoice_number/download_available
Duplicate order không phát hành trùng theo tenant_id + tenant_shop_id + source_order_id
Order ID trùng giữa 2 shop khác nhau không bị block nhầm
SePay token cache hoạt động
SePay 401 refresh token retry 1 lần
Config response không lộ client_secret
Config response không lộ Pancake api_key
HTTP logger redact query param api_key
Usage đọc được cả quota_remaining và quota_remaning (API typo)
Product import Excel parse đúng header
Product import upsert không tạo trùng mã
Product import lưu raw_json đầy đủ
Product lookup theo source_product_code đúng
Product không tìm thấy -> fallback order item, log warning
Product default_invoice_unit = "cái" khi unit = "ĐVT cơ bản"
Tax profile resolve theo shop-level trước tenant-level
Thiếu tax profile + unknown_product_policy=warn -> dùng default_tax_rate và trả warning
Thiếu tax profile + unknown_product_policy=block -> block create draft
GTGT invoice item dùng đúng tax_rate từ product_tax_profiles
```

## 19. Tests P1

```text
Webhook nhận order mới
Webhook duplicate không tạo job trùng
Webhook verify per-shop secret header
Retry failed job không duplicate nếu đã issued
Download PDF trả base64/file metadata
Download XML trả base64/file metadata
Tenant A không xem được invoice job tenant B
User tenant A không truy cập được tenant_shop của tenant B
Audit log ghi khi create draft
Audit log ghi khi issue invoice
Audit log ghi khi config integration
Background job retry max 3 lần
Background job timeout sau 20 polling retries
Sepay polling timeout -> job status = timeout
```

## 20. Giai Đoạn Triển Khai

### Phase 1: Platform Foundation

```text
Fastify server
env config
PostgreSQL connection
Zod validation
error handler
OpenAPI base
health/readiness endpoints
correlation id
structured logger + api_key/secret redaction
```

### Phase 2: Identity + Tenant + RBAC

```text
users/tenants/memberships tables
tenant_shops table
login
JWT/session
tenant context middleware
shop access guard
permissions
actor từ req.user
bỏ actor fields từ client
audit base schema
```

### Phase 3: Jobs Infrastructure

```text
pg-boss + PostgreSQL
background_jobs table
worker process
retry/backoff
locked_until stale recovery
poll_attempts/max_poll_attempts
dead-letter handling
worker graceful shutdown
```

### Phase 4: Integration Configs

```text
Pancake config per tenant_shop
SePay config tenant-level + shop override optional
secret encryption
masked config response
test Pancake connection
test SePay connection
provider account/usage endpoints
```

### Phase 5: Pancake POS Client

```text
query api_key auth
full URL log redaction
list orders with filters
get order detail
order status policy
list products/variations
check order.einvoices/invoice_info_list
```

### Phase 6: Product Catalog

```text
products table
product_tax_profiles table
shop_tax_defaults table
product import from Fintab Excel
product lookup by source_product_code/barcode
tax profile import/update
tax defaults per shop
product API endpoints
product web admin
fallback order item + mapping warning nếu không tìm thấy product
```

### Phase 7: Invoice Mapper + Preview

```text
map buyer
map items với product lookup từ catalog
resolve tax profile cho từng order item
map discount/shipping/surcharge/payment
validate required fields
validate tax_rate for GTGT
mapping warnings nếu thiếu tax profile hoặc dùng default tax
preview payload
source_order_snapshot_json
mapping_warnings_json
```

### Phase 8: SePay Service + Invoice Jobs

```text
copy/adapt SepayEInvoiceClient
database-backed/encrypted token cache nếu multi-worker
invoice_jobs table
idempotency unique tenant_id + tenant_shop_id + source + source_order_id
create draft via background job
poll create via worker
issue via background job
poll issue via worker
download PDF/XML metadata/base64 flow
```

### Phase 9: Web Admin

```text
login
dashboard
shop switcher
cấu hình Pancake/SePay
cấu hình Tax Mapping theo shop
đơn hàng
sản phẩm + tax profile
preview
phát hành
jobs history
audit logs
```

### Phase 10: Webhook Automation

```text
webhook_inbox table
webhook endpoint
per-shop header validation
dedupe/replay
auto-create job
audit/logs
```

## 21. Stack Đề Xuất

Production-oriented:

```text
Node.js 20+
Fastify
Zod
PostgreSQL
JWT
OpenAPI
node:test hoặc Vitest
pg-boss cho job queue
```

MVP đơn giản hơn:

```text
Node.js 20+
Fastify
PostgreSQL
JWT/session đơn giản
OpenAPI thủ công hoặc generated từ Zod schema
pg-boss + PostgreSQL
```

Khuyến nghị hiện tại:

```text
Fastify + PostgreSQL + Zod + OpenAPI + pg-boss
```

## 22. Thông Tin Cần Cung Cấp Khi Bắt Đầu Code

```text
Tenant name/company
Pancake shop_name
Pancake shop_id
Pancake api_key
Pancake webhook secret/header
SePay client_id
SePay client_secret
SePay env: sandbox | production
provider_account_id (sẽ lấy qua API)
template_code mặc định: 1 | 2
invoice_series (từ provider account)
default payment_method
default tax_rate nếu dùng GTGT
order status policy cho create draft/issue
COD issue policy
```

## 23. Quyết Định Cần Chốt

1. Một Pancake order chỉ được xuất 1 hóa đơn hay nhiều hóa đơn theo type/series/account.
2. COD có được phát hành ngay không hay phải chờ status 16 - Đã thu tiền.
3. Discount phân bổ theo dòng hay tạo line_type=3 riêng.
4. Shipping fee/surcharge có xuất thành dòng hóa đơn không.
5. Frontend dùng chung repo với backend hay tách app riêng.
6. Auth frontend dùng session cookie hay JWT bearer.
7. Icon package: @phosphor-icons/react hay @radix-ui/react-icons.
8. Có dùng Framer Motion không.
9. Accent màu chính cho UI: emerald, deep rose, hoặc electric blue desaturated.

## 24. Quyết Định Đã Chốt

```text
Fastify + PostgreSQL
Pancake POS API làm nguồn dữ liệu
SePay SDK hiện có làm invoice provider
Background job xử lý async từ đầu (không blocking HTTP 30-60s)
Hỗ trợ cả 2 loại hóa đơn: GTGT (1) và bán hàng (2)
Luôn tạo nháp trước, sau đó user bấm phát hành
Web admin riêng
Webhook để tự động hóa ở phase 2
Polling interval: 3 giây
Max polling retries: 20 (60 giây timeout)
Job queue: pg-boss + PostgreSQL
Multi-tenant shared schema: tenant_id + tenant_shop_id
Mỗi Pancake shop có api_key/webhook_secret riêng
Mỗi shop phải có SePay config riêng (client_id, client_secret, provider_account_id, template_code, invoice_series) cho production. Tenant-level config chỉ dùng làm template, không dùng để issue production.
```

## 25. Error Handling

```text
SepayError:
  code
  message
  http_status
  raw_response
  tracking_code
  provider: sepay
```

**Các lỗi cần xử lý:**

```text
TOKEN_ERROR      -> clear token cache, retry 1 lần
HTTP_400         -> validate payload, trả lỗi chi tiết
HTTP_401         -> refresh token, retry 1 lần
HTTP_500         -> log, có thể retry
CREATE_FAILED    -> lưu error_json vào invoice_jobs
ISSUE_FAILED     -> lưu error_json vào invoice_jobs
TIMEOUT         -> job status = timeout, cho check lại sau
NETWORK_ERROR    -> retry với backoff
VALIDATION_ERROR -> trả lỗi cho client
```

**Behavior khi polling timeout:**

```text
Job status = timeout
Invoice_jobs.status = timeout
Hiển thị "Đang xử lý - timeout, vui lòng check lại"
User bấm "Check lại trạng thái" -> gọi checkCreateStatus/Issue
Hoặc user bấm "Retry" -> enqueue job mới
```

## 26. Known Issues Từ SePay API

```text
1. API field "quota_remaning" thiếu chữ "i"
   -> SDK đã handle cả quota_remaining và quota_remaning

2. discount_tax case: field total_before_tax trả về giá trị lạ
   -> nhưng total_amount vẫn đúng
   -> chỉ dùng total_amount để hiển thị

3. Create và Issue đều async
   -> KHÔNG gọi xong là có kết quả ngay
   -> PHẢI polling /check endpoint

4. Hóa đơn nháp không trừ hạn ngạch
   -> chỉ phát hành (issue) mới trừ
```

## 27. Thông Tin Cần Chuẩn Bị Trước Khi Thiết Kế Chi Tiết

Section này lưu lại các dữ liệu, quyết định và guardrails cần có trước khi lập kiến trúc chi tiết/scaffold dự án.

### 27.1. Mô Hình Triển Khai Theo Tenant/Shop

Mỗi khách hàng có tài khoản đăng nhập riêng (email/password). Sau khi login, user chỉ thấy dữ liệu của tenant mình và chỉ quản lý shop(s) thuộc tenant đó.

```
1 tenant = 1 khách hàng/doanh nghiệp
1 tenant có thể có nhiều Pancake shops
mỗi Pancake shop có shop_id, api_key, webhook_secret riêng
mỗi Pancake shop có SePay config riêng (bắt buộc cho production)
```

Quy tắc bắt buộc cho production:

```
tenant
  -> tenant_shops[]
      -> Pancake config riêng (bắt buộc)
      -> webhook secret riêng
      -> SePay config riêng (BẮT BUỘC cho production)

SePay config gắn bắt buộc theo từng shop.
Không dùng tenant-level SePay config để phát hành production.
```

Lý do:
- Mỗi khách hàng thường có tài khoản SePay riêng (client_id/client_secret riêng)
- provider_account_id/template_code/invoice_series thường theo MST hoặc chi nhánh
- Tránh nhầm lẫn config giữa các shop/tenant
- Dễ audit, dễ revoke riêng từng shop

### 27.2. Data Model Bổ Sung Cho Shop Config

```text
tenant_shops:
  id
  tenant_id
  provider: pancake
  external_shop_id                 # Pancake SHOP_ID
  shop_name
  status: active | inactive
  config_json
  encrypted_secret_json
  created_at
  updated_at
```

Ví dụ `config_json`:

```json
{
  "base_url": "https://pos.pages.fm/api/v1",
  "shop_id": "714938587",
  "default_order_status_for_issue": [3, 16],
  "allow_create_draft_statuses": [1, 2, 3, 16]
}
```

Ví dụ `encrypted_secret_json`:

```json
{
  "api_key": "...encrypted...",
  "webhook_secret": "...encrypted..."
}
```

### 27.3. Pancake API Auth Chính Xác

Theo OpenAPI spec trong `/Users/hangha/diginno/pancake-api-docs/pancake-api-docs/skills-pos-pancake/openapi-pos.json`, Pancake POS API dùng API key qua query param:

```text
api_key=YOUR_API_KEY
```

Không dùng `Authorization: Bearer` cho POS API implementation, dù một README trong docs có ghi Bearer. Khi code client phải coi OpenAPI spec là nguồn chính.

Lưu ý bảo mật:

```text
Vì api_key nằm trong query string, logger/proxy/access log phải redact query param api_key.
Không log full URL chứa api_key.
```

### 27.4. Dữ Liệu Bắt Buộc Cho Từng Shop

Pancake:

```text
- shop_id
- api_key
- shop_name
- public webhook URL/domain
- webhook secret/header muốn cấu hình
- danh sách trạng thái đơn được phép tạo nháp/phát hành
```

SePay:

```text
- env: sandbox | production
- client_id
- client_secret
- provider_account_id
- template_code: 1 | 2
- invoice_series
- default payment_method
- default tax_rate nếu dùng hóa đơn GTGT
```

Business rules cần chốt:

```text
- 1 order chỉ xuất 1 hóa đơn hay cho phép nhiều hóa đơn theo type/series/account?
- khi nào được create draft?
- khi nào được issue?
- COD có được issue ngay không hay phải chờ đối soát/thu tiền?
- phí ship có xuất thành dòng hóa đơn không?
- surcharge/phụ thu xử lý thế nào?
- discount phân bổ theo dòng hay tạo dòng chiết khấu riêng?
- hóa đơn mặc định là template_code=1 hay template_code=2?
```

### 27.5. Pancake Order Status Policy

Status từ Pancake docs:

```text
0  = Mới
1  = Đã xác nhận
2  = Đã gửi hàng
3  = Đã nhận
16 = Đã thu tiền
4  = Đang hoàn
15 = Hoàn một phần
5  = Đã hoàn
6  = Đã hủy
7  = Đã xóa
```

Policy đề xuất cho MVP:

```text
Create draft allowed:
- 1 Đã xác nhận
- 2 Đã gửi hàng
- 3 Đã nhận
- 16 Đã thu tiền

Issue allowed:
- 3 Đã nhận
- 16 Đã thu tiền

Blocked:
- 4 Đang hoàn
- 15 Hoàn một phần
- 5 Đã hoàn
- 6 Đã hủy
- 7 Đã xóa
```

COD cần chốt riêng với kế toán. Nếu COD chưa đối soát, nên chỉ cho tạo nháp hoặc chờ status `16 - Đã thu tiền` mới phát hành.

### 27.6. Pancake Fields Cần Dùng Khi Mapping

Order fields:

```text
bill_full_name
bill_phone_number
bill_email
shipping_address.full_address
items[].quantity
items[].discount_each_product
items[].is_bonus_product
items[].variation_info.name
items[].variation_info.retail_price
items[].variation_info.barcode
shipping_fee
total_discount
discount
surcharge
tax
cash
cod
transfer_money
charged_by_card
charged_by_momo
charged_by_qrpay
charged_by_vnpay
charged_by_fundiin
charged_by_kredivo
payment_purchase_histories
bank_payments
money_to_collect
total_price
invoice_info_list
einvoices
```

Item mapping đề xuất:

```text
items[].variation_info.name         -> item_name
items[].variation_info.retail_price -> unit_price
items[].variation_info.barcode      -> item_code
items[].quantity                    -> quantity
items[].discount_each_product       -> item discount
items[].is_bonus_product            -> line_type=2
shipping_fee                        -> shipping line nếu config bật
surcharge                           -> surcharge line nếu config bật
discount/total_discount             -> discount line hoặc phân bổ theo policy
```

### 27.7. Payment Method Mapping Mở Rộng

Pancake có nhiều nguồn thanh toán hơn mapping ban đầu:

```text
cash
transfer_money
cod
charged_by_card
charged_by_momo
charged_by_qrpay
charged_by_vnpay
charged_by_fundiin
charged_by_kredivo
payment_purchase_histories
bank_payments
```

Rule đề xuất:

```text
cash > 0 only -> TM
transfer_money > 0 only -> CK
charged_by_qrpay/vnpay/momo/card/fundiin/kredivo > 0 -> CK hoặc KHAC theo config
cash + non-cash -> TM/CK
cod > 0 và chưa collected -> KHAC hoặc block issue theo config
fallback -> default_payment_method
```

### 27.8. Webhook Theo Từng Shop

Pancake webhook config hỗ trợ custom headers qua `webhook_headers`, nên dùng per-shop secret header.

Backend endpoint đề xuất:

```text
POST /v1/webhooks/pancake
```

Header:

```text
X-PANCAKE-WEBHOOK-SECRET: <secret của shop>
```

Webhook config gửi lên Pancake:

```json
{
  "shop": {
    "webhook_enable": true,
    "webhook_url": "https://your-domain.com/v1/webhooks/pancake",
    "webhook_email": "ops@example.com",
    "webhook_types": ["orders", "products", "variations_warehouses"],
    "webhook_headers": {
      "X-PANCAKE-WEBHOOK-SECRET": "secret-per-shop"
    }
  }
}
```

Backend verify:

```text
1. Lấy shop_id từ payload hoặc tìm theo webhook secret.
2. Tìm tenant_shop tương ứng.
3. So sánh header secret với encrypted webhook_secret.
4. Lưu webhook inbox.
5. Dedupe theo shop_id + event type + order_id + updated_at/payload_hash.
6. Enqueue job nếu event đủ điều kiện xử lý.
```

### 27.9. Chống Xuất Trùng Với Dữ Liệu Pancake

Trước khi tạo draft:

```text
1. Check local invoice_jobs theo tenant_id + tenant_shop_id + source_order_id.
2. Check Pancake order.einvoices hoặc invoice_info_list nếu có.
3. Nếu đã issued thì block.
4. Nếu đang processing thì trả job hiện tại.
5. Nếu failed/timeout thì cho retry theo policy.
```

Unique đề xuất nếu cho phép nhiều hóa đơn theo series/type:

```text
tenant_id + tenant_shop_id + source + source_order_id + invoice_type + sepay_invoice_series
```

Policy đơn giản cho MVP:

```text
1 Pancake order chỉ được xuất 1 hóa đơn chính thức.
```

### 27.10. Deployment Config Cần Có

Backend:

```text
PUBLIC_BASE_URL
DATABASE_URL
QUEUE backend: pg-boss/PostgreSQL
ENCRYPTION_MASTER_KEY
JWT/session secret
CORS allowed origins
admin bootstrap email/password hoặc SSO config
```

Worker:

```text
worker concurrency
polling interval: 3s
max polling retries: 20
stale lock timeout
retry backoff policy
```

Ops:

```text
log retention
audit retention
backup policy
alert email/webhook
```

### 27.11. Security Checklist Bắt Buộc

```text
- Không lưu Pancake api_key/SePay secret dạng plain text.
- Không trả secret về frontend.
- Mask secret trong log/audit/error.
- Redact query param api_key khỏi HTTP logs.
- Rotate Pancake API key nếu đã từng commit vào docs/template.
- Webhook phải có per-shop secret header.
- Request size limit cho webhook và import file.
- Rate limit cho login, test connection, webhook và list endpoints.
```

### 27.12. Quyết Định Cần Chốt Trước Khi Code

```text
1. Queue đã chốt pg-boss + PostgreSQL.
2. MVP có cho một order xuất nhiều hóa đơn không, hay 1 order chỉ 1 hóa đơn?
3. COD có được phát hành ngay không, hay chỉ khi status 16 - Đã thu tiền?
4. Hóa đơn mặc định là template_code=2 bán hàng hay cho user chọn từng đơn?
5. Discount phân bổ theo dòng hay tạo line_type=3 riêng?
6. Shipping fee/surcharge có xuất thành dòng hóa đơn không?
7. Có cần sync trực tiếp Pancake products/variations hay chỉ dùng Fintab Excel import ở MVP?
8. Frontend dùng chung repo hay tách app riêng?
9. Frontend dùng session cookie hay JWT bearer?
10. Icon package dùng @phosphor-icons/react hay @radix-ui/react-icons?
11. Có dùng Framer Motion cho motion layer không?
```

### 27.13. Kiến Trúc Per-Shop Login + Per-Shop SePay Config

Đây là kiến trúc production khuyến nghị khi mỗi khách hàng có tài khoản SePay riêng.

#### 27.13.1. Mô Hình Đăng Nhập

```
User login với email/password
-> backend xác thực, tạo httpOnly secure session cookie
-> frontend gọi GET /v1/me
-> backend trả về: user info + tenant_id + danh sách shops được phép truy cập
-> user chọn shop hiện tại (hoặc mặc định shop đầu tiên)
-> mọi request sau đều chạy trong context tenant_id + tenant_shop_id
```

#### 27.13.2. Frontend Pages

```
/login                          - Login form
/onboarding                     - First-time setup (tạo tenant, shop, config)
/dashboard                      - Bento overview
/shops                          - List + manage shops
/shops/:shopId                  - Shop detail
/shops/:shopId/settings         - Shop settings hub
/shops/:shopId/settings/pancake - Pancake config per shop
/shops/:shopId/settings/sepay   - SePay config per shop
/shops/:shopId/settings/webhook - Webhook config per shop
/shops/:shopId/settings/rules    - Invoice rules per shop
/orders                         - Orders list (context: current shop)
/orders/:orderId                - Order detail + invoice preview
/invoices                       - Invoice jobs list
/jobs/:jobId                    - Job status + polling
/audit                          - Audit logs
```

#### 27.13.3. Backend Enforcement

Mỗi khi tạo draft hoặc issue invoice:

```
1. Lấy user từ session cookie
2. Lấy tenant_id từ session/membership
3. Validate user có quyền trên tenant_shop_id
4. Lấy SePay config theo tenant_shop_id
5. NẾU khong co config shop-level:
   -> KHI sandbox: dùng tenant-level config (nếu có)
   -> KHI production: BLOCK với error SHOP_SEPAY_CONFIG_REQUIRED
6. Ghi audit log
```

Error response khi thiếu shop SePay config:

```json
{
  "error": {
    "code": "SHOP_SEPAY_CONFIG_REQUIRED",
    "message": "Shop này chưa cấu hình tài khoản SePay. Vui lòng vào Cấu hình > SePay để thiết lập trước khi phát hành."
  }
}
```

#### 27.13.4. Tenant Isolation

```
Tenant A không thể:
- Xem/sửa shop của tenant B
- Xem/sửa SePay config của tenant B
- Xem invoice jobs của tenant B
- Truy cập webhook của tenant B

Shop 1 không thể dùng SePay config của Shop 2 (cùng tenant)
```

#### 27.13.5. First-Time Onboarding Flow

```
1. User đăng ký / được tạo tài khoản (email + password)
2. Tạo tenant (company name)
3. Tạo shop đầu tiên (shop name, Pancake shop_id)
4. Nhập Pancake api_key
5. Test Pancake connection
6. Nhập SePay client_id/client_secret
7. Lấy provider accounts
8. Chọn provider_account_id/template/series
9. Test SePay connection
10. Bắt đầu xem orders và tạo hóa đơn
```

#### 27.13.6. Multi-Shop Support

```
Một user có thể thuộc nhiều shops (cùng tenant hoặc khác tenant nếu có membership đó).
Shop switcher cho phép chuyển context nhanh.
Mỗi shop có config riêng:
  - Shop A: Pancake API key A, SePay account A
  - Shop B: Pancake API key B, SePay account B (hoặc cùng SePay account nhưng series khác)
```

#### 27.13.7. Secrets Per Shop

```
Pancake:
  tenant_shops.encrypted_secret_json.api_key = encrypted Pancake API key
  tenant_shops.encrypted_secret_json.webhook_secret = encrypted webhook secret

SePay:
  integration_configs (tenant_shop_id = shop.id, provider = sepay):
    encrypted_secret_json.client_id = encrypted
    encrypted_secret_json.client_secret = encrypted
    encrypted_secret_json.access_token = encrypted (runtime only, not stored long-term)
```

#### 27.13.8. API Endpoint Per-Shop

```
# SePay config per shop
GET    /v1/shops/:shopId/sepay/config
PUT    /v1/shops/:shopId/sepay/config
POST   /v1/shops/:shopId/sepay/test
GET    /v1/shops/:shopId/sepay/provider-accounts
GET    /v1/shops/:shopId/sepay/usage

# Pancake per shop
GET    /v1/shops/:shopId/orders
GET    /v1/shops/:shopId/orders/:orderId
GET    /v1/shops/:shopId/products
POST   /v1/shops/:shopId/test-pancake
POST   /v1/shops/:shopId/configure-webhook

# Invoice per shop (shopId from context, not always in URL)
POST   /v1/invoices/preview
POST   /v1/invoices/create-draft
POST   /v1/invoices/issue
GET    /v1/invoices/jobs
```

### IMPORTANT IMPLEMENTATION NOTE:
Section 27.13 is ARCHITECTURAL OVERVIEW for the plan. When implementing, the actual task breakdown in docs/plans/fintab-sepay-platform/tasks/ must be updated to reflect these per-shop patterns. Specifically:
- AUTH-001: login must return tenant + shops list
- TENANT-001: must enforce shop-level context and isolation
- INT-003: SePay config is per-shop, not per-tenant
- FE-101: login screen with proper states
- FE-102: shop settings with per-shop SePay config tab
- INVJOB-002/003: must require shop-level SePay config for production issue

## 28. Frontend Architecture Plan

Frontend là web admin cho integration hub, không chỉ là demo. UI phải hỗ trợ full interaction cycle: loading, empty, error, success, polling, retry và permission-denied states.

### 28.1. Frontend Stack Đề Xuất

```text
Next.js App Router
React Server Components mặc định
Tailwind CSS
Zod schema sharing hoặc generated API client từ OpenAPI
Icons: @phosphor-icons/react hoặc @radix-ui/react-icons sau khi check package.json
Framer Motion chỉ dùng nếu đã install hoặc install trước khi code
```

Dependency rule khi code:

```text
Trước khi import framer-motion, @phosphor-icons/react, @radix-ui/react-icons, zustand hoặc bất kỳ package nào:
1. Check package.json.
2. Nếu thiếu, ghi rõ lệnh install.
3. Không assume package đã có.
```

### 28.2. Frontend Folder Structure

```text
app/
  login/
  (auth)/
    onboarding/
  (platform)/
    dashboard/
    shops/
      page.tsx                          # /shops - list shops
      [shopId]/
        page.tsx                       # /shops/:shopId - shop overview
        settings/
          page.tsx                     # /shops/:shopId/settings - hub
          pancake/page.tsx            # /shops/:shopId/settings/pancake
          sepay/page.tsx              # /shops/:shopId/settings/sepay
          webhook/page.tsx            # /shops/:shopId/settings/webhook
          rules/page.tsx              # /shops/:shopId/settings/rules
          tax/page.tsx                # /shops/:shopId/settings/tax
    orders/
    products/
      [productId]/tax/page.tsx        # /products/:productId/tax
    invoices/
    jobs/
    audit/
    settings/                          # user-level settings

features/
  auth/
    login-form/
    session-provider/
  tenant/
  shop-switcher/
  shop-management/
  pancake-config/
  sepay-config/
  webhook-config/
  invoice-rules/
  tax-mapping/
  orders/
  product-catalog/
  invoice-preview/
  invoice-issue/
  job-history/
  audit-log/
```

RSC/client split:

```text
Server Components:
- page shell
- static layout composition
- initial data fetch nếu không chứa secret

Client Components:
- forms
- shop switcher
- polling job status
- preview editor
- modals/drawers
- motion widgets
- any component using useState/useReducer/useEffect/useMotionValue
```

### 28.3. Frontend Design Baseline

```text
DESIGN_VARIANCE = 8
MOTION_INTENSITY = 6
VISUAL_DENSITY = 4
```

UI rules:

```text
- Dashboard dùng asymmetric bento, không dùng generic 3 equal cards.
- Technical UI không dùng serif.
- Không dùng Inter cho premium UI.
- Font đề xuất: Geist + Geist Mono hoặc Satoshi + JetBrains Mono.
- Không dùng emoji trong code, markup, text content hoặc alt text.
- Không dùng purple/blue neon AI gradient.
- Max 1 accent color, saturation < 80%.
- Palette nhất quán: zinc/slate neutral + một accent.
- Không dùng h-screen cho hero/full-height section; dùng min-h-[100dvh].
- Layout desktop có thể asymmetric, mobile <768px phải collapse strict single column.
- Dùng CSS grid thay cho flex percentage math.
- Cards chỉ dùng khi elevation có ý nghĩa; ưu tiên border/divide/negative space cho data-heavy areas.
```

Motion rules:

```text
- Motion nặng phải nằm trong isolated leaf Client Component.
- Không animate top/left/width/height; chỉ transform/opacity.
- Magnetic hover nếu dùng Framer Motion thì dùng useMotionValue/useTransform, không dùng useState.
- Perpetual micro-animation phải memoized và không trigger parent re-render.
- Server Components không chứa motion state.
```

### 28.4. Required Screens

```text
Login
Dashboard
Shop Switcher / Shop Management
Pancake Config
SePay Config
Orders List / Order Detail
Product Catalog / Import
Product Tax Mapping
Invoice Preview
Invoice Issue Flow
Job History
Audit Logs
Settings
```

### 28.5. Screen Requirements

Login:

```text
- Label above input.
- Inline errors below input.
- Button loading state.
- No generic circular spinner; use button skeleton/shimmer or text state.
```

Dashboard:

```text
- Bento overview: shops configured, jobs running, drafts, issued invoices, latest failures.
- Empty state nếu chưa có shop.
- Asymmetric layout desktop, single column mobile.
```

Shop management:

```text
- List tenant_shops.
- Show connection status per shop.
- Show webhook status.
- Mask Pancake api_key/webhook_secret.
- Actions: create shop, edit config, test connection, configure webhook.
```

Pancake config:

```text
- shop_id
- shop_name
- api_key input write-only
- webhook_secret input write-only
- allowed draft statuses
- allowed issue statuses
- Test connection state: loading/success/error
```

SePay config:

```text
- env sandbox/production
- client_id
- client_secret write-only
- provider account selector
- template code selector
- invoice series selector
- default payment method
- default tax rate
- usage/quota display
- Test connection state
```

Tax mapping config:

```text
- default VAT/tax rate per shop
- default invoice unit per shop
- unknown product policy: warn | block | use_default
- bulk update tax_rate theo product group
- import/update product tax profiles từ Excel
- show count: mapped products, missing tax profile, using default tax
```

Orders:

```text
- Filters: shop, status, search, date range, source/updateStatus.
- Status badge theo Pancake status.
- Warning nếu order.einvoices hoặc invoice_info_list đã có dữ liệu.
- Actions: view detail, preview invoice.
- Loading skeleton theo table/list layout.
- Empty state hướng dẫn sync/config shop.
```

Products:

```text
- Import Fintab Excel.
- Import result: inserted, updated, skipped, failed.
- Product table filter theo group/status/source.
- Lookup theo source_product_code/barcode.
- Tax rate column.
- Tax profile status: mapped | missing | using default.
- Product detail has tax profile edit form.
- Warning khi order item không match catalog.
```

Invoice preview:

```text
- Buyer info editable.
- Items mapping editable where allowed.
- Shipping fee line.
- Discount line hoặc discount allocation warning.
- Surcharge line.
- Payment method mapping.
- Tax warnings for GTGT.
- Show resolved tax source per item: product_profile | tenant_profile | shop_default | manual_override.
- Allow accountant to adjust tax_rate in preview before create draft.
- Highlight items missing product tax profile.
- Snapshot warning: preview uses immutable source_order_snapshot_json.
- Create Draft button returns job and routes to job status.
```

Issue flow:

```text
- Draft status.
- Issue button gated by invoice:issue permission.
- Job polling panel.
- Timeout state with Check Status and Retry.
- Download PDF/XML only when issued.
```

Jobs:

```text
- Filter by shop/status/type/date.
- Show retry count, poll attempts, last_error masked.
- Retry action permission-gated.
- Correlation id visible for support.
```

Audit logs:

```text
- Filter by actor/action/shop/resource/date.
- Show before/after masked.
- Include system/worker/webhook actor types.
```

### 28.6. Frontend Data And State Flow

```text
Global state only for:
- current tenant
- current shop
- auth/session context if needed

Local state for:
- forms
- filters
- modals
- preview editor

Polling:
- job status polling in Client Component only
- stop polling on success/failed/timeout/cancelled/unmount
- use cleanup in useEffect
```

API response expectations:

```text
Success envelope:
{
  "data": {},
  "meta": { "request_id": "..." }
}

Error envelope:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": []
  },
  "meta": { "request_id": "..." }
}
```

### 28.7. Frontend Security Requirements

```text
- Không hiển thị Pancake api_key sau khi lưu.
- Không hiển thị SePay client_secret/access_token sau khi lưu.
- Config API chỉ trả masked flags như has_api_key, has_client_secret, last_updated_at.
- Không gửi tenant_id/actor fields từ client để backend tin trực tiếp.
- Client gửi shopId theo route/action, backend vẫn phải validate tenant_shop ownership.
- Error view không render raw provider response nếu có secret.
- RBAC guard ở cả frontend và backend; frontend guard chỉ để UX, backend mới là source of truth.
```

### 28.8. Frontend Quality Gates

```text
- Mobile layout không overflow ngang.
- Full-height sections dùng min-h-[100dvh].
- Loading, empty, error states tồn tại ở mọi screen data/form.
- No emoji.
- No Inter unless explicitly changed later.
- No pure black; use zinc-950/charcoal.
- No neon glow/purple-blue AI gradient.
- Form labels above inputs, helper/error text below.
- Tactile active state on buttons: scale-[0.98] hoặc -translate-y-[1px].
- Motion code has cleanup and isolated client boundaries.
```
