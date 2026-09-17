-- Migration: Decouple subscriptions from organizations table to be payment-processor agnostic

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused', 'deactivated')),
    payment_provider TEXT,
    payment_customer_id TEXT,
    payment_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    custom_entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by payment subscription ID across webhooks
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_sub_id ON public.subscriptions(payment_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organization_id);

-- 2. Migrate existing plan and payment data from organizations table into subscriptions table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'plan'
    ) THEN
        INSERT INTO public.subscriptions (
            organization_id,
            plan,
            status,
            payment_provider,
            payment_customer_id,
            payment_subscription_id,
            current_period_end,
            custom_entitlements
        )
        SELECT 
            o.id AS organization_id,
            COALESCE(o.plan, 'free') AS plan,
            COALESCE(
                CASE 
                    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_status')
                    THEN o.subscription_status 
                    ELSE 'active'
                END, 
                'active'
            ) AS status,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'payment_provider')
                THEN o.payment_provider
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id') AND o.stripe_customer_id IS NOT NULL
                THEN 'stripe'
                ELSE NULL
            END AS payment_provider,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'provider_customer_id') AND o.provider_customer_id IS NOT NULL
                THEN o.provider_customer_id
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'stripe_customer_id')
                THEN o.stripe_customer_id
                ELSE NULL
            END AS payment_customer_id,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'provider_subscription_id') AND o.provider_subscription_id IS NOT NULL
                THEN o.provider_subscription_id
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'stripe_subscription_id')
                THEN o.stripe_subscription_id
                ELSE NULL
            END AS payment_subscription_id,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'current_period_end')
                THEN o.current_period_end
                ELSE NULL
            END AS current_period_end,
            CASE 
                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'custom_entitlements')
                THEN COALESCE(o.custom_entitlements, '{}'::jsonb)
                ELSE '{}'::jsonb
            END AS custom_entitlements
        FROM public.organizations o
        ON CONFLICT (organization_id) DO NOTHING;
    END IF;
END $$;

-- 3. Drop constraints and columns from organizations table
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE public.organizations
  DROP COLUMN IF EXISTS plan,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS payment_provider,
  DROP COLUMN IF EXISTS provider_customer_id,
  DROP COLUMN IF EXISTS provider_subscription_id,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS current_period_end,
  DROP COLUMN IF EXISTS custom_entitlements;

-- 4. Trigger to automatically create default subscription entry when a new organization is inserted
CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (organization_id, plan, status)
    VALUES (NEW.id, 'free', 'active')
    ON CONFLICT (organization_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_organization_created_subscription ON public.organizations;
CREATE TRIGGER trigger_on_organization_created_subscription
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_organization_subscription();

-- 5. Row Level Security (RLS) policies for subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscriptions are viewable by members of the organization" ON public.subscriptions;
CREATE POLICY "Subscriptions are viewable by members of the organization"
ON public.subscriptions FOR SELECT
USING (organization_id = get_auth_user_org_id() OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Subscriptions are updatable by organization owners/admins" ON public.subscriptions;
CREATE POLICY "Subscriptions are updatable by organization owners/admins"
ON public.subscriptions FOR UPDATE
USING (organization_id = get_auth_user_org_id() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
));

