'use client';

import { apiFetch } from '@/lib/api/client';

export async function listInvoiceJobsClient() {
  return apiFetch<Array<Record<string, unknown>>>('/v1/invoices/jobs', { cache: 'no-store' });
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
