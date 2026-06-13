CREATE TABLE IF NOT EXISTS pancake_order_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  source_order_id text NOT NULL,
  order_number text,
  customer_name text,
  customer_phone text,
  customer_email text,
  total_amount numeric(18, 2),
  payment_status text NOT NULL DEFAULT 'unknown' CHECK (payment_status IN ('paid', 'unpaid', 'unknown')),
  payment_status_reason text,
  pancake_status text,
  pancake_status_label text,
  pancake_inserted_at timestamptz,
  pancake_updated_at timestamptz,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id, source_order_id)
);

CREATE TABLE IF NOT EXISTS pancake_order_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'incremental')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  current_page integer NOT NULL DEFAULT 0,
  page_size integer NOT NULL DEFAULT 100,
  total_pages integer NOT NULL DEFAULT 0,
  total_entries integer NOT NULL DEFAULT 0,
  synced_count integer NOT NULL DEFAULT 0,
  paid_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  error_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pancake_order_snapshots_shop_updated ON pancake_order_snapshots(tenant_id, tenant_shop_id, pancake_updated_at DESC NULLS LAST, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pancake_order_snapshots_payment ON pancake_order_snapshots(tenant_id, tenant_shop_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_pancake_order_snapshots_search ON pancake_order_snapshots(tenant_id, tenant_shop_id, source_order_id, order_number);
CREATE INDEX IF NOT EXISTS idx_pancake_order_sync_runs_shop_created ON pancake_order_sync_runs(tenant_id, tenant_shop_id, created_at DESC);
