# Go-Live Rehearsal

Run this flow with Pancake test shop and SePay sandbox credentials before production issue is enabled.

## Checklist
1. Login as production-admin test account.
2. Configure Pancake shop API key and webhook secret.
3. Test Pancake connection.
4. Sync products.
5. Sync or load completed orders.
6. Configure SePay sandbox credentials.
7. Load provider accounts.
8. Select provider account, template, and invoice series.
9. Verify SePay automation safe defaults: dry run on, auto create off, auto issue off, confirmation required.
10. Open invoice preview for a completed order.
11. Verify buyer info, tax lines, totals, and invoice type.
12. Create draft.
13. Confirm background job moves through worker execution.
14. Refresh/check status until draft exists.
15. Issue sandbox invoice.
16. Refresh/check status until issued.
17. Download PDF and XML.
18. Test automation only in sandbox: first with dry run on to confirm no real create/issue, then with dry run off only after manual flow is verified.
19. If auto issue is tested, verify it only runs when auto issue is on and buyer request confirmation satisfies the configured guard.
20. Verify audit logs for config update, draft request, issue request, download request, and retry if tested.
21. Verify another user without shop access cannot access the shop/order/invoice.
22. Verify `GET /v1/health` and `GET /v1/ready`.
23. Verify rollback procedure and backup status are documented.

## Signoff
- Pancake connection passed: pending
- SePay sandbox flow passed: pending
- SePay automation safe-default check passed: pending
- SePay automation sandbox dry-run check passed: pending
- PDF/XML download passed: pending
- Audit verification passed: pending
- Tenant/shop isolation manual check passed: pending
- Backup/rollback reviewed: pending
