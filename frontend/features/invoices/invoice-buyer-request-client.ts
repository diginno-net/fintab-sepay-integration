'use client';

import { apiFetch } from '@/lib/api/client';

export type InvoiceBuyerRequestClient = {
  id: string | null;
  source: 'saved' | 'pancake';
  tenantId?: string;
  tenantShopId?: string;
  sourceOrderId?: string;
  buyerType: 'personal' | 'company';
  contactName: string | null;
  buyerUnitName: string | null;
  legalName: string | null;
  taxCode: string | null;
  identityNumber: string | null;
  invoiceAddress: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  paymentMethod: string | null;
  templateCode: string | null;
  invoiceSeries: string | null;
  taxRate: number | null;
  notes: string | null;
  confirmed: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceBuyerRequestInputClient = {
  buyerType?: 'personal' | 'company';
  contactName?: string | null;
  buyerUnitName?: string | null;
  legalName?: string | null;
  taxCode?: string | null;
  identityNumber?: string | null;
  invoiceAddress?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  paymentMethod?: string | null;
  templateCode?: string | null;
  invoiceSeries?: string | null;
  taxRate?: number | null;
  notes?: string | null;
  confirmed?: boolean;
};

export type DraftStatus = {
  hasDraft: boolean;
  outdated: boolean;
  requiresDraftRecreate?: boolean;
  wrongCompanyDraft?: boolean;
  draftOutdatedMessage?: string;
  draftStatus?: string;
  invoiceJobId?: string;
};

export async function getInvoiceBuyerRequestClient(shopId: string, orderId: string): Promise<InvoiceBuyerRequestClient | null> {
  return apiFetch<InvoiceBuyerRequestClient | null>(`/v1/invoices/requests/${shopId}/${orderId}`, { cache: 'no-store' });
}

export async function upsertInvoiceBuyerRequestClient(
  shopId: string,
  orderId: string,
  input: InvoiceBuyerRequestInputClient
): Promise<InvoiceBuyerRequestClient> {
  return apiFetch<InvoiceBuyerRequestClient>(`/v1/invoices/requests/${shopId}/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function getDraftStatusClient(shopId: string, orderId: string): Promise<DraftStatus> {
  return apiFetch<DraftStatus>(`/v1/invoices/requests/${shopId}/${orderId}/draft-status`, { cache: 'no-store' });
}
