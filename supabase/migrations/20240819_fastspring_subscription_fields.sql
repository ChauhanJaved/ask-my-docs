-- Migration: Add generic paywall and subscription fields to organizations table

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'business'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS custom_entitlements JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index for quick lookup by provider subscription ID in webhooks
CREATE INDEX IF NOT EXISTS idx_organizations_provider_sub ON organizations(provider_subscription_id);
