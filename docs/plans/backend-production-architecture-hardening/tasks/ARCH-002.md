# Task: ARCH-002 - Align docs with actual custom queue implementation

## Metadata
- Status: pending
- Estimate: 30m
- Depends on: ARCH-001

## Files to Modify
- `README.md` (MODIFY)
- `docs/backend-architecture.md` (MODIFY)

## Description
Update public project docs so they do not claim pg-boss is the active queue runtime if the code uses the custom PostgreSQL queue.

## Requirements
- Replace or qualify wording that says runtime queue is pg-boss.
- State current queue implementation is `background_jobs` table + worker polling.
- Mention pg-boss only as dependency/possible roadmap if still present.
- Keep README concise; detailed explanation belongs in `docs/backend-architecture.md`.

## Verification
```bash
grep -R "pg-boss" README.md docs || true
```

## Notes
- If pg-boss references remain, they must be clearly marked as deferred or historical.

---
**⚠️ KHÔNG VIẾT CODE Ở ĐÂY** - Code sẽ được implement bởi Executor agent
