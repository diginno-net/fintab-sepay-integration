# fintab-sepay-integration

Integration service ket noi Pancake POS voi SePay eInvoice API.

- Repository: https://github.com/diginno-net/fintab-sepay-integration
- Backend: Fastify 5 + TypeScript + PostgreSQL 16 + custom PostgreSQL background_jobs worker
- Frontend: Next.js 15 + React 19 + Tailwind CSS
- Database: PostgreSQL voi multi-tenant architecture va RBAC

## Project Guidance

- Uu tien security, correctness, maintainability, sau do moi toi performance va UX.
- Khong hardcode secrets; dung environment variables.
- Validate external inputs bang Zod khi lam backend/API.
- Giu module boundaries ro rang theo huong modular monolith/DDD-lite.
