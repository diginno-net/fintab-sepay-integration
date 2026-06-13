-- Migration: 002_invoice_buyer_requests
-- Stores per-order invoice buyer overrides (company/personal mapping)
CREATE TABLE IF NOT EXISTS invoice_buyer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  source_order_id text NOT NULL,
  buyer_type text NOT NULL DEFAULT 'personal' CHECK (buyer_type IN ('personal', 'company')),
  contact_name text,
  buyer_unit_name text,
  legal_name text,
  tax_code text,
  identity_number text,
  invoice_address text,
  buyer_email text,
  buyer_phone text,
  payment_method text DEFAULT 'TM/CK',
  template_code text,
  invoice_series text,
  tax_rate integer,
  notes text,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id, source_order_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_buyer_requests_shop_order ON invoice_buyer_requests(tenant_shop_id, source_order_id);
