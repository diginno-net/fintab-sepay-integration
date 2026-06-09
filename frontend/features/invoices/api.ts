import { cookies } from 'next/headers';
import { apiFetchWithCookie } from '@/lib/api/client';

async function cookieHeader() {
  return (await cookies()).toString();
}

export async function listInvoiceJobs() {
  return apiFetchWithCookie<Array<Record<string, unknown>>>('/v1/invoices/jobs', await cookieHeader(), { cache: 'no-store' });
}

export async function getInvoiceJob(jobId: string) {
  return apiFetchWithCookie<Record<string, unknown>>(`/v1/invoices/jobs/${jobId}`, await cookieHeader(), { cache: 'no-store' });
}
