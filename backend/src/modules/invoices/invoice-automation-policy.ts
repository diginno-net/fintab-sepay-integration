import type { SepayAutomationSettings } from '../sepay/sepay.service.js';

export type InvoiceAutomationReason =
  | 'dry_run_enabled'
  | 'auto_create_disabled'
  | 'auto_issue_disabled'
  | 'order_not_paid'
  | 'status_not_allowed'
  | 'invoice_request_not_confirmed'
  | 'invoice_already_issued'
  | 'validation_failed';

export type InvoiceAutomationDecision = {
  allowed: boolean;
  dryRun: boolean;
  reason?: InvoiceAutomationReason;
};

export function evaluateAutoCreateDraft(input: {
  settings: SepayAutomationSettings;
  legacyAutoCreateDraft?: boolean;
  orderPaid: boolean;
  statusAllowed: boolean;
  alreadyIssued?: boolean;
  valid?: boolean;
}): InvoiceAutomationDecision {
  if (input.alreadyIssued) return blocked(input.settings, 'invoice_already_issued');
  if (input.settings.dryRun) return blocked(input.settings, 'dry_run_enabled');
  if (!input.settings.autoCreateInvoice && input.legacyAutoCreateDraft !== true) return blocked(input.settings, 'auto_create_disabled');
  if (!input.statusAllowed) return blocked(input.settings, 'status_not_allowed');
  if (!input.orderPaid) return blocked(input.settings, 'order_not_paid');
  if (input.valid === false) return blocked(input.settings, 'validation_failed');
  return { allowed: true, dryRun: input.settings.dryRun };
}

export function evaluateAutoIssue(input: {
  settings: SepayAutomationSettings;
  invoiceStatus: string;
  invoiceRequestConfirmed?: boolean;
  alreadyIssued?: boolean;
  valid?: boolean;
}): InvoiceAutomationDecision {
  if (input.alreadyIssued || input.invoiceStatus === 'issued') return blocked(input.settings, 'invoice_already_issued');
  if (input.settings.dryRun) return blocked(input.settings, 'dry_run_enabled');
  if (!input.settings.autoIssueInvoice) return blocked(input.settings, 'auto_issue_disabled');
  if (input.invoiceStatus !== 'draft_created') return blocked(input.settings, 'validation_failed');
  if (input.settings.requireAccountantConfirmationBeforeAutoIssue && input.invoiceRequestConfirmed !== true) {
    return blocked(input.settings, 'invoice_request_not_confirmed');
  }
  if (input.valid === false) return blocked(input.settings, 'validation_failed');
  return { allowed: true, dryRun: input.settings.dryRun };
}

function blocked(settings: SepayAutomationSettings, reason: InvoiceAutomationReason): InvoiceAutomationDecision {
  return { allowed: false, dryRun: settings.dryRun, reason };
}
