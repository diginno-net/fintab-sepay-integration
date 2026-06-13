# Fintab/Pancake POS x SePay eInvoice Integration

> Integration service để lấy dữ liệu đơn hàng/sản phẩm từ Pancake POS, phục vụ luồng Fintab đã đồng bộ sẵn, và phát hành hóa đơn điện tử qua SePay eInvoice API.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-000?style=flat-square&logo=fastify)](https://fastify.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Tech Stack](#tech-stack)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Bắt đầu](#bắt-đầu)
  - [Yêu cầu](#yêu-cầu)
  - [Cài đặt](#cài-đặt)
  - [Chạy ứng dụng](#chạy-ứng-dụng)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Tính năng chính](#tính-năng-chính)
- [Luồng xử lý hóa đơn](#luồng-xử-lý-hóa-đơn)
- [RBAC & Security](#rbac--security)
- [Background Jobs](#background-jobs)
- [Contributing](#contributing)
- [License](#license)

---

## Tổng quan

Dự án này là một **backend integration service** kết hợp **web admin interface**, có nhiệm vụ:

1. **Kết nối Pancake POS** - Lấy dữ liệu đơn hàng và sản phẩm qua Pancake POS Open API
2. **Xử lý đơn hàng** - Áp dụng chính sách thuế, ánh xạ sản phẩm, quản lý trạng thái
3. **Phát hành hóa đơn điện tử** - Tạo và phát hành hóa đơn GTGT/Bán hàng qua SePay eInvoice API
4. **Giao diện quản trị** - Dashboard theo dõi job, hóa đơn, đơn hàng, cấu hình cửa hàng

### Use Case

```
Pancake POS (Webshop/POS) 
    -> Backend Integration Service 
    -> SePay eInvoice API 
    -> Hóa đơn điện tử (XML/PDF)
```

---

## Kiến trúc

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                        │
│   Dashboard | Orders | Invoices | Products | Shops | Settings      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend API (Fastify 5)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Auth    │  │ Invoices │  │ Pancake  │  │  SePay   │            │
│  │  Module  │  │  Module  │  │  Client  │  │  Client  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Products │  │  Tenant  │  │   Jobs   │  │  Audit   │            │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│          Background Worker (custom PostgreSQL queue)                  │
│     Invoice Creation │ Invoice Issuance │ Token Refresh │ Sync      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│             PostgreSQL 16 + background_jobs queue                    │
│  tenants | users | orders | invoices | products | jobs | audit_logs │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Fastify | 5.x | Web framework |
| TypeScript | 5.x | Language |
| PostgreSQL | 16 | Database |
| Custom PostgreSQL queue | - | Background job queue via `background_jobs` |
| Zod | 3.x | Validation |
| Vitest | 2.x | Testing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 | React framework |
| React | 19 | UI library |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 12.x | Animation |
| Phosphor Icons | - | Icons |
| Zod | 3.x | Validation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker Compose | Local development |
| PostgreSQL 16 Alpine | Database |
| httpOnly Cookies | Session management |

---

## Cấu trúc dự án

```
fintab-sepay-integration/
├── backend/                    # Fastify backend service
│   ├── db/
│   │   ├── migrations/        # SQL migrations
│   │   └── migrate.ts         # Migration runner
│   ├── src/
│   │   ├── config/            # Environment config (env.ts)
│   │   ├── modules/           # Feature modules (DDD-inspired)
│   │   │   ├── access-control/   # RBAC service
│   │   │   ├── audit/            # Audit logging
│   │   │   ├── identity/         # Auth/user management
│   │   │   ├── integrations/     # Secret management
│   │   │   ├── invoices/        # Invoice mapper, state machine, routes
│   │   │   ├── jobs/           # Background job handlers
│   │   │   ├── pancake/        # Pancake POS API client
│   │   │   ├── products/       # Product catalog, import
│   │   │   ├── sepay/          # SePay eInvoice client
│   │   │   ├── tax/            # Tax resolution service
│   │   │   ├── tenant/         # Tenant/shop management
│   │   │   └── webhooks/       # Pancake webhook inbox
│   │   ├── shared/            # Shared utilities
│   │   │   ├── auth/             # Auth middleware, permissions
│   │   │   ├── http/            # Error handler, validation
│   │   │   ├── observability/   # Logger, correlation ID
│   │   │   ├── openapi/         # OpenAPI spec
│   │   │   ├── persistence/     # Database connection
│   │   │   └── queue/           # Custom PostgreSQL queue
│   │   ├── app.ts             # Fastify app builder
│   │   ├── server.ts          # HTTP server entry
│   │   └── queue-worker.ts    # Background worker entry
│   └── tests/                 # Backend tests
├── frontend/                  # Next.js frontend
│   ├── app/
│   │   ├── (auth)/           # Login, onboarding
│   │   └── (platform)/       # Main app routes
│   │       ├── dashboard/
│   │       ├── orders/
│   │       ├── invoices/
│   │       ├── products/
│   │       ├── shops/
│   │       ├── jobs/
│   │       ├── audit/
│   │       └── settings/
│   ├── components/           # Shared UI components
│   ├── features/             # Feature-based modules
│   └── lib/                  # API client utilities
├── docs/
│   └── plans/                # Feature plans & tasks
│       ├── fintab-sepay-platform/
│       └── ...
├── docker-compose.yml        # PostgreSQL service
├── package.json              # Workspace root
├── PLAN.md                  # Detailed implementation plan
└── README.md
```

---

## Bắt đầu

### Yêu cầu

- **Node.js** 20+
- **pnpm** (recommended) or npm
- **PostgreSQL** 16 (hoặc dùng Docker)

### Cài đặt

```bash
# Clone repository
git clone https://github.com/diginno-net/fintab-sepay-integration.git
cd fintab-sepay-integration

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL via Docker
docker compose up -d postgres
```

### Chạy ứng dụng

```bash
# Start backend (development)
pnpm --filter backend dev

# Start frontend (development)
pnpm --filter frontend dev

# Start background worker
pnpm --filter backend worker
```

### Build production

```bash
# Build both frontend and backend
pnpm build

# Run production
pnpm --filter backend start
```

---

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/login` | User login |
| POST | `/v1/auth/logout` | User logout |
| GET | `/v1/auth/me` | Get current user |

### Tenant & Shops

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/tenant-shops` | List all shops |
| POST | `/v1/tenant-shops` | Create new shop |
| GET | `/v1/tenant-shops/:shopId` | Get shop details |
| PUT | `/v1/tenant-shops/:shopId` | Update shop |
| DELETE | `/v1/tenant-shops/:shopId` | Delete shop |

### Pancake Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/pancake/shops/:shopId/orders` | Fetch orders from Pancake |
| GET | `/v1/pancake/shops/:shopId/products` | Fetch products from Pancake |
| POST | `/v1/webhooks/pancake` | Pancake webhook receiver |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/invoices/preview` | Preview invoice mapping |
| POST | `/v1/invoices/create-draft` | Enqueue draft creation |
| POST | `/v1/invoices/issue` | Enqueue invoice issuance |
| GET | `/v1/invoices` | List invoices |
| GET | `/v1/invoices/:invoiceId` | Get invoice details |
| GET | `/v1/invoices/:invoiceId/pdf` | Download invoice PDF |
| GET | `/v1/invoices/:invoiceId/xml` | Download invoice XML |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/jobs/:jobId` | Poll job status |
| GET | `/v1/jobs` | List all jobs |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/products` | List products |
| POST | `/v1/products/import` | Import products from Excel |
| PUT | `/v1/products/:productId/tax-profile` | Update tax profile |

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `tenants` | Multi-tenant organizations |
| `users` | User accounts with email/password |
| `memberships` | Tenant-user role bindings |
| `sessions` | Secure session tokens |
| `tenant_shops` | Pancake shop configuration per tenant |
| `integration_configs` | SePay/Pancake credentials (encrypted) |

### Business Tables

| Table | Description |
|-------|-------------|
| `products` | Product catalog from Fintab/Pancake |
| `product_tax_profiles` | Per-product tax mapping |
| `shop_tax_defaults` | Shop-level tax defaults |
| `invoice_jobs` | Invoice creation/issuance tracking |
| `invoice_payload_snapshots` | Immutable order snapshots |
| `background_jobs` | Custom PostgreSQL job queue entries |
| `webhook_inbox` | Webhook deduplication |
| `audit_logs` | Full audit trail |
| `sepay_token_cache` | SePay access token storage |

### ER Diagram (Simplified)

```
tenants ───< memberships >─── users
   │
   └──< tenant_shops
           │
           ├──< integration_configs
           ├──< products
           │      └──< product_tax_profiles
           ├──< invoice_jobs
           │      └── invoice_payload_snapshots
           ├──< webhook_inbox
           └──< audit_logs

background_jobs (standalone custom PostgreSQL queue)
sepay_token_cache (standalone)
sessions (standalone - user auth)
```

---

## Tính năng chính

### 1. Multi-tenant Architecture
- Hoàn toàn isolated giữa các tenant
- Mỗi tenant có thể quản lý nhiều shops
- Cấu hình Pancake POS và SePay riêng per shop

### 2. RBAC (Role-Based Access Control)

| Role | Permissions |
|------|------------|
| `owner` | Full access, manage billing |
| `admin` | Full access, manage users |
| `accountant` | View invoices, reports |
| `operator` | Process orders, create invoices |
| `viewer` | Read-only access |

### 3. Pancake POS Integration
- Open API để sync orders và products
- Webhook support cho real-time updates
- Order status policy enforcement
- Idempotency (một invoice per order)

### 4. SePay eInvoice Integration
- Token caching với auto-renewal
- Async invoice creation (draft mode)
- Async invoice issuance
- Polling-based status checking
- PDF/XML download
- Hỗ trợ cả GTGT (VAT) và Ban Hang (commercial)

### 5. Tax Resolution
- Áp dụng tax profile per product
- Shop-level tax defaults
- Tax rate mapping: -2, -1, 0, 5, 8, 10
- Line type mapping: goods, discounts, promotions, shipping

### 6. Background Job System
- Custom PostgreSQL `background_jobs` queue cho reliable async workflows
- Async workflows (non-blocking HTTP)
- Retry logic với configurable max attempts
- Job status polling và timeout handling

### 7. Security
- httpOnly session cookies
- Secret encryption at rest (AES-256-GCM)
- API key redaction trong logs
- RBAC permission enforcement
- Rate limiting
- CORS policy

---

## Luồng xử lý hóa đơn

```
1. Fetch Order
   └── GET /v1/pancake/shops/:shopId/orders

2. Preview Invoice
   └── POST /v1/invoices/preview
       └── Validate mapping, calculate tax, return preview

3. Create Draft (async)
   └── POST /v1/invoices/create-draft
       └── Enqueue job → background worker → SePay createInvoice
       └── Poll job status → GET /v1/jobs/:jobId

4. Issue Invoice (async)
   └── POST /v1/invoices/issue
       └── Enqueue job → background worker → SePay issueInvoice
       └── Poll job status → GET /v1/jobs/:jobId

5. Download
   └── GET /v1/invoices/:id/pdf | /xml
```

---

## RBAC & Security

### Permission Matrix

| Action | owner | admin | accountant | operator | viewer |
|--------|-------|-------|------------|----------|--------|
| Manage users | ✓ | ✓ | - | - | - |
| Manage shops | ✓ | ✓ | - | - | - |
| View orders | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create invoice draft | ✓ | ✓ | ✓ | ✓ | - |
| Issue invoice | ✓ | ✓ | ✓ | ✓ | - |
| View invoices | ✓ | ✓ | ✓ | ✓ | ✓ |
| View audit logs | ✓ | ✓ | - | - | - |
| Manage products | ✓ | ✓ | - | ✓ | - |
| Import products | ✓ | ✓ | - | ✓ | - |
| Platform settings | ✓ | ✓ | - | - | - |

### Secret Management
- Integration credentials (SePay API key, Pancake tokens) được encrypt trước khi lưu
- Sử dụng `ENCRYPTION_MASTER_KEY` từ environment
- Thuật toán: AES-256-GCM với random IV per encryption

---

## Background Jobs

### Job Types

| Job | Description | Retry |
|-----|-------------|-------|
| `invoice-create-draft` | Tạo draft invoice trên SePay | 3x |
| `invoice-issue` | Phát hành invoice trên SePay | 3x |
| `sepay-token-refresh` | Refresh SePay access token | 1x |
| `pancake-order-sync` | Sync orders từ Pancake | 3x |

### Job States

```
pending → started → completed
                └── failed → retry
                        └── exhausted (max retries reached)
```

---

## Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## License

MIT License - xem [LICENSE](LICENSE) file để biết thêm chi tiết.

---

## Liên hệ

- **Company**: Diginno Net
- **Website**: https://diginno.net
- **Email**: contact@diginno.net
