export const defaultDraftStatuses = [1, 2, 3, 16];
export const defaultIssueStatuses = [3, 16];

export function canCreateDraft(status: number, allowedStatuses = defaultDraftStatuses): boolean {
  return allowedStatuses.includes(status);
}

export function canIssue(status: number, allowedStatuses = defaultIssueStatuses): boolean {
  return allowedStatuses.includes(status);
}

export function hasExistingInvoice(order: Record<string, unknown>): boolean {
  const einvoices = order.einvoices;
  const invoiceInfoList = order.invoice_info_list;
  return (Array.isArray(einvoices) && einvoices.length > 0) || (Array.isArray(invoiceInfoList) && invoiceInfoList.length > 0);
}
