# FE-Badge-001: Thêm Invoice-specific Badge Variants

## Status
pending

## Description
Thêm invoice-specific badge variants cho components/status/badge.tsx: issued, draft, pending, failed, timeout, cancelled.

## Files
- `frontend/components/status/badge.tsx` (modify)

## Acceptance Criteria
- [ ] Thêm variants cho invoice statuses:
  - issued: emerald/success
  - draft_created: blue
  - draft_create_queued, draft_create_polling, draft_create_running: amber
  - issue_queued, issue_polling, issue_running: amber
  - failed: red/danger
  - timeout: orange
  - cancelled: neutral/gray
- [ ] Update existing badges nếu cần
- [ ] TypeScript strict, no any

## Dependencies
None

## Estimate
1h
