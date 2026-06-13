# Implementation Plan: Shop Access Hardening

## Overview
Siết chặt phân quyền theo từng shop bằng mô hình `Tenant Role + Shop Access Level = Effective Permission`.

## Goals
- User chỉ thấy dữ liệu shop được gán.
- User chỉ thao tác đúng cấp quyền trong từng shop.
- Backend là security boundary chính.
- Frontend chỉ hỗ trợ UX và quản trị phân quyền.

## Execution Order
1. Backend hotfix: validate target user thuộc tenant, fix product list không `shopId`.
2. Backend policy layer: `ShopAction`, access-level matrix, action-specific assertion.
3. Route migration: read/write routes dùng action-specific checks.
4. API contract: update shop access payload, `/v1/me` trả `accessLevel`, `isDefault`.
5. Frontend: update session type, shop access table, client payload.
6. Verification: backend/frontend typecheck, tests, frontend build.

## Verification
```bash
npm --prefix backend run typecheck
npm --prefix backend test
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

## Security Rules
- Không được gán shop cho user ngoài tenant.
- List endpoint không truyền `shopId` không được leak tenant-wide data.
- `viewer` chỉ được read.
- `member` được vận hành hóa đơn cơ bản nhưng không cấu hình integration.
- `admin` được cấu hình/sync/retry.
- `owner` toàn quyền shop.
