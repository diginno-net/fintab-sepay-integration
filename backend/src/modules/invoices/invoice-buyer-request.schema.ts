import { z } from 'zod';

export const buyerTypeSchema = z.enum(['personal', 'company']);
export type BuyerType = z.infer<typeof buyerTypeSchema>;

export const invoiceBuyerRequestSchema = z.object({
  buyerType: buyerTypeSchema.default('personal'),
  contactName: z.string().nullable().default(null),
  buyerUnitName: z.string().nullable().default(null),
  legalName: z.string().nullable().default(null),
  taxCode: z.string().nullable().default(null),
  identityNumber: z.string().nullable().default(null),
  invoiceAddress: z.string().nullable().default(null),
  buyerEmail: z.string().nullable().default(null),
  buyerPhone: z.string().nullable().default(null),
  paymentMethod: z.string().nullable().default(null),
  templateCode: z.string().nullable().default(null),
  invoiceSeries: z.string().nullable().default(null),
  taxRate: z.number().nullable().default(null),
  notes: z.string().nullable().default(null),
  confirmed: z.boolean().default(false)
});

export type InvoiceBuyerRequestInput = z.infer<typeof invoiceBuyerRequestSchema>;

export type InvoiceBuyerRequest = InvoiceBuyerRequestInput & {
  id: string;
  tenantId: string;
  tenantShopId: string;
  sourceOrderId: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceBuyerRequestResponse = (InvoiceBuyerRequest & { source: 'saved' }) | (InvoiceBuyerRequestInput & {
  id: null;
  source: 'pancake';
  tenantId?: undefined;
  tenantShopId?: undefined;
  sourceOrderId?: undefined;
  createdAt?: undefined;
  updatedAt?: undefined;
});

export const invoiceBuyerRequestParamsSchema = z.object({
  shopId: z.string().uuid(),
  orderId: z.string().min(1)
});
