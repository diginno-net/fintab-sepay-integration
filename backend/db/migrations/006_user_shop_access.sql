CREATE TABLE IF NOT EXISTS user_shop_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_shop_id uuid NOT NULL REFERENCES tenant_shops(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'member' CHECK (access_level IN ('owner', 'admin', 'member', 'viewer')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, tenant_shop_id)
);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS current_tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_shop_access_user
  ON user_shop_access(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_shop_access_shop
  ON user_shop_access(tenant_id, tenant_shop_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_shop_access_one_default
  ON user_shop_access(tenant_id, user_id)
  WHERE is_default = true;

WITH ranked_access AS (
  SELECT
    m.tenant_id,
    m.user_id,
    ts.id AS tenant_shop_id,
    CASE WHEN m.role IN ('owner', 'admin') THEN m.role ELSE 'member' END AS access_level,
    row_number() OVER (PARTITION BY m.tenant_id, m.user_id ORDER BY ts.created_at ASC, ts.id ASC) AS rn
  FROM memberships m
  JOIN tenant_shops ts ON ts.tenant_id = m.tenant_id
)
INSERT INTO user_shop_access(tenant_id, user_id, tenant_shop_id, access_level, is_default)
SELECT tenant_id, user_id, tenant_shop_id, access_level, rn = 1
FROM ranked_access
ON CONFLICT (tenant_id, user_id, tenant_shop_id) DO NOTHING;
