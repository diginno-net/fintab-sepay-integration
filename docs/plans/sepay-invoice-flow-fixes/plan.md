# SePay Invoice Flow Fixes

## Context

MEW invoice jobs currently fail before draft creation because SePay token retrieval returns `401 UNAUTHORIZED` with provider message `Thông tin xác thực không hợp lệ`.

The UI can also mislead users because:

- `/v1/shops/:shopId/sepay/test` may return HTTP 200 with `{ ok: false }`.
- Worker error serialization stores only `message`, dropping AppError code/details.
- Invoice job detail can show `TAX_MAPPING_WARNING` as the primary failure when the real failure is SePay authentication.

## Goals

- Make SePay test fail with HTTP 400 when credentials are invalid.
- Preserve SePay error code/details in background and invoice jobs.
- Show true job failure first; keep tax mapping warnings as separate amber warnings.
- Link users to the correct shop SePay settings page.
- Keep draft, issue, and PDF/download flows debuggable with precise errors.

## Tasks

1. Fix SePay test endpoint and error humanization.
2. Serialize AppError/SepayError details in worker failures.
3. Fix frontend SePay config test handling.
4. Fix invoice job detail error display and settings links.
5. Improve job action/download messages where needed.
6. Run backend tests and frontend/backend typecheck.

## Acceptance Criteria

- Bad SePay credentials show a clear authentication error.
- UI no longer displays `TAX_MAPPING_WARNING` as the main failure if `error_json` exists.
- Failed invoice jobs preserve `code`, `message`, `statusCode`, and `details`.
- Settings action opens `/shops/:shopId/settings/sepay`.
- Existing tests/typechecks pass.
