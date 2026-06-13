'use client';

import { apiFetch } from '@/lib/api/client';

export async function listInvoiceJobsClient(input: { shopId?: string } = {}) {
  const params = new URLSearchParams();
  if (input.shopId) params.set('shopId', input.shopId);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<Array<Record<string, unknown>>>(`/v1/invoices/jobs${suffix}`, { cache: 'no-store' });
}

export async function getInvoiceJobClient(jobId: string) {
  return apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${jobId}`, { cache: 'no-store' });
}

export async function retryInvoiceJobClient(invoiceJobId: string) {
  return apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${invoiceJobId}/retry`, {
    method: 'POST',
  });
}

export async function refreshInvoiceJobClient(invoiceJobId: string) {
  return apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${invoiceJobId}/refresh`, {
    method: 'POST',
  });
}
