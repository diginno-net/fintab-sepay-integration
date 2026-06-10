import { cookies } from 'next/headers';
import { apiFetchWithCookie, apiFetch } from '@/lib/api/client';

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listInvoiceJobs() {
  return apiFetchWithCookie<Array<Record<string, unknown>>>('/v1/invoices/jobs', await cookieHeader(), { cache: 'no-store' });
}

export async function getInvoiceJob(jobId: string) {
  return apiFetchWithCookie<Record<string, unknown>>(`/v1/invoices/jobs/${jobId}`, await cookieHeader(), { cache: 'no-store' });
}

export async function retryInvoiceJob(invoiceJobId: string) {
  const cookie = await cookieHeader();
  return apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${invoiceJobId}/retry`, {
    method: 'POST',
    headers: { cookie }
  });
}

export async function refreshInvoiceJob(invoiceJobId: string) {
  const cookie = await cookieHeader();
  return apiFetch<Record<string, unknown>>(`/v1/invoices/jobs/${invoiceJobId}/refresh`, {
    method: 'POST',
    headers: { cookie }
  });
}
