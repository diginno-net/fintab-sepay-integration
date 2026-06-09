CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'operator', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'pancake',
  external_shop_id text NOT NULL,
  shop_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  encrypted_secret_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, external_shop_id)
);

CREATE TABLE IF NOT EXISTS integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('sepay', 'pancake')),
  scope text NOT NULL CHECK (scope IN ('tenant', 'shop')),
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  encrypted_secret_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id, provider)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('fintab_export', 'pancake_pos')),
  source_product_code text NOT NULL,
  product_name text NOT NULL,
  product_type text NOT NULL DEFAULT 'goods',
  unit text,
  default_invoice_unit text NOT NULL DEFAULT 'cái',
  allow_negative_stock boolean NOT NULL DEFAULT false,
  group_code text,
  group_name text,
  warehouse_code text,
  business_category text,
  excise_tax text,
  status text NOT NULL DEFAULT 'active',
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, source, source_product_code)
);

CREATE TABLE IF NOT EXISTS product_tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  source_product_code text NOT NULL,
  product_name_snapshot text,
  tax_rate integer NOT NULL CHECK (tax_rate IN (-2, -1, 0, 5, 8, 10)),
  tax_category text NOT NULL CHECK (tax_category IN ('taxable', 'non_taxable', 'non_declarable', 'zero_rated')),
  invoice_line_type integer NOT NULL DEFAULT 1 CHECK (invoice_line_type IN (1, 2, 3, 4)),
  invoice_unit text,
  is_tax_inclusive_price boolean NOT NULL DEFAULT true,
  effective_from date,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id, source_product_code)
);

CREATE TABLE IF NOT EXISTS shop_tax_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  default_tax_rate integer NOT NULL CHECK (default_tax_rate IN (-2, -1, 0, 5, 8, 10)),
  default_invoice_unit text NOT NULL DEFAULT 'cái',
  default_invoice_type text NOT NULL DEFAULT 'ban_hang' CHECK (default_invoice_type IN ('gtgt', 'ban_hang')),
  unknown_product_policy text NOT NULL DEFAULT 'warn' CHECK (unknown_product_policy IN ('warn', 'block', 'use_default')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id)
);

CREATE TABLE IF NOT EXISTS invoice_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'pancake_pos',
  source_order_id text NOT NULL,
  source_order_display_id text,
  source_order_status text,
  source_order_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  invoice_type text NOT NULL CHECK (invoice_type IN ('gtgt', 'ban_hang')),
  idempotency_key text NOT NULL,
  sepay_provider_account_id text,
  sepay_template_code text,
  sepay_invoice_series text,
  sepay_create_tracking_code text,
  sepay_issue_tracking_code text,
  sepay_reference_code text,
  invoice_number text,
  invoice_status text,
  issued_date timestamptz,
  download_available boolean NOT NULL DEFAULT false,
  pdf_artifact_id uuid,
  xml_artifact_id uuid,
  total_before_tax numeric(18, 2),
  tax_amount numeric(18, 2),
  total_amount numeric(18, 2),
  request_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_json jsonb,
  mapping_warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  issued_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  UNIQUE (tenant_id, tenant_shop_id, source, source_order_id)
);

CREATE TABLE IF NOT EXISTS invoice_payload_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  invoice_job_id uuid REFERENCES invoice_jobs(id) ON DELETE CASCADE,
  source_order_id text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS background_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE CASCADE,
  invoice_job_id uuid REFERENCES invoice_jobs(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  poll_attempts integer NOT NULL DEFAULT 0,
  max_poll_attempts integer NOT NULL DEFAULT 20,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_until timestamptz,
  locked_by text,
  dedupe_key text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_error_json jsonb,
  dead_lettered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS webhook_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'pancake',
  event_type text NOT NULL,
  external_event_id text,
  source_object_id text NOT NULL,
  source_updated_at timestamptz,
  payload_hash text NOT NULL,
  headers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_shop_id, event_type, source_object_id, payload_hash)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'system', 'worker', 'webhook')),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  permission text,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sepay_token_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE CASCADE,
  env text NOT NULL CHECK (env IN ('sandbox', 'production')),
  client_id_hash text NOT NULL,
  encrypted_access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, tenant_shop_id, env, client_id_hash)
);

CREATE INDEX IF NOT EXISTS idx_tenant_shops_tenant ON tenant_shops(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_status ON products(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_group ON products(tenant_id, group_code);
CREATE INDEX IF NOT EXISTS idx_product_tax_profiles_code ON product_tax_profiles(tenant_id, source_product_code);
CREATE INDEX IF NOT EXISTS idx_invoice_jobs_tenant_shop_status ON invoice_jobs(tenant_id, tenant_shop_id, status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_status_run_after ON background_jobs(status, run_after);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
