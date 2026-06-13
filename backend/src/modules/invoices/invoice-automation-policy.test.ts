import { describe, expect, it } from 'vitest';
import { evaluateAutoCreateDraft, evaluateAutoIssue } from './invoice-automation-policy.js';
import type { SepayAutomationSettings } from '../sepay/sepay.service.js';

const safeDefaults: SepayAutomationSettings = {
  dryRun: true,
  autoCreateInvoice: false,
  autoIssueInvoice: false,
  requireAccountantConfirmationBeforeAutoIssue: true
};

describe('invoice automation policy', () => {
  it('blocks real create while dry run is enabled', () => {
    const decision = evaluateAutoCreateDraft({ settings: { ...safeDefaults, autoCreateInvoice: true }, orderPaid: true, statusAllowed: true });
    expect(decision).toEqual({ allowed: false, dryRun: true, reason: 'dry_run_enabled' });
  });

  it('blocks create when automation is disabled', () => {
    const decision = evaluateAutoCreateDraft({ settings: { ...safeDefaults, dryRun: false }, orderPaid: true, statusAllowed: true });
    expect(decision.reason).toBe('auto_create_disabled');
  });

  it('allows create when enabled and order is eligible', () => {
    const decision = evaluateAutoCreateDraft({ settings: { ...safeDefaults, dryRun: false, autoCreateInvoice: true }, orderPaid: true, statusAllowed: true });
    expect(decision.allowed).toBe(true);
  });

  it('keeps legacy webhook auto create compatible', () => {
    const decision = evaluateAutoCreateDraft({ settings: { ...safeDefaults, dryRun: false }, legacyAutoCreateDraft: true, orderPaid: true, statusAllowed: true });
    expect(decision.allowed).toBe(true);
  });

  it('blocks issue unless auto issue is enabled', () => {
    const decision = evaluateAutoIssue({ settings: { ...safeDefaults, dryRun: false }, invoiceStatus: 'draft_created', invoiceRequestConfirmed: true });
    expect(decision.reason).toBe('auto_issue_disabled');
  });

  it('requires confirmation before issue by default', () => {
    const decision = evaluateAutoIssue({ settings: { ...safeDefaults, dryRun: false, autoIssueInvoice: true }, invoiceStatus: 'draft_created', invoiceRequestConfirmed: false });
    expect(decision.reason).toBe('invoice_request_not_confirmed');
  });

  it('allows issue when confirmed', () => {
    const decision = evaluateAutoIssue({ settings: { ...safeDefaults, dryRun: false, autoIssueInvoice: true }, invoiceStatus: 'draft_created', invoiceRequestConfirmed: true });
    expect(decision.allowed).toBe(true);
  });
});
