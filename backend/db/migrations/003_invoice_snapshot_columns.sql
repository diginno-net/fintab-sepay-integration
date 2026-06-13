-- Migration: 003_invoice_snapshot_columns
-- Adds snapshot and hash columns for draft outdated detection
ALTER TABLE invoice_jobs
  ADD COLUMN IF NOT EXISTS invoice_buyer_request_snapshot_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_request_hash text,
  ADD COLUMN IF NOT EXISTS requires_draft_recreate boolean DEFAULT false;
