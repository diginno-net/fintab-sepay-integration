ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_shop_id uuid REFERENCES tenant_shops(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_tenant_id_source_source_product_code_key'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_tenant_id_source_source_product_code_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_shop_source_code_unique
  ON products(tenant_id, tenant_shop_id, source, source_product_code)
  WHERE tenant_shop_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_global_source_code_unique
  ON products(tenant_id, source, source_product_code)
  WHERE tenant_shop_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_tenant_shop_status ON products(tenant_id, tenant_shop_id, status);
