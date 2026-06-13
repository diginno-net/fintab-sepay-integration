# Implementation Plan: Redesign UI Fintab x SePay

## Overview
Redesign frontend theo hướng **Invoice Operations Command Center**: sạch, chắc, premium, phù hợp dashboard nghiệp vụ hóa đơn, thuế, POS và background jobs.

Mục tiêu là nâng giao diện mà không rewrite business logic. Thay đổi tập trung vào design foundation, component nền, shell, landing, login, dashboard và onboarding.

## Technical Approach
- Dùng Next.js 15, React 19, Tailwind v3 hiện tại.
- Giữ component nội bộ thay vì setup shadcn full trong phase này.
- Không thay backend/API.
- Không đổi data flow, permission, session, routing.
- Dùng `frontend/DESIGN.md` làm source of truth cho design language.

## Visual Direction
Concept: **Warm Invoice Command Center**.

- Warm ivory canvas, porcelain surfaces, graphite text.
- Single muted teal accent.
- Sidebar dạng control panel.
- Tables dense but breathable.
- Landing/login dùng split asymmetric layout.
- Dashboard dùng pipeline/status thay vì card row generic.

## Task Breakdown
1. Save design system and task files.
2. Update global theme, fonts, and tokens.
3. Redesign layout primitives.
4. Redesign form primitives.
5. Redesign status and data primitives.
6. Redesign platform shell and navigation.
7. Redesign landing page.
8. Redesign login experience.
9. Redesign dashboard.
10. Redesign onboarding wizard.
11. Smoke review remaining pages.
12. Run verification commands.

## Verification
```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

## Constraints
- No shadcn full migration in this phase.
- No business logic changes.
- No backend/API changes.
- No unrelated cleanup.
