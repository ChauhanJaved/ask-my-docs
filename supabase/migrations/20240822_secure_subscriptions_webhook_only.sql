-- Migration: Enforce webhook-only updates on subscriptions table
-- Disallow direct client-side updates (owners/admins) to prevent subscription plan spoofing.
-- Subscriptions are strictly updated by authorized webhooks (using service_role) and initialized by trigger on organization creation.

DROP POLICY IF EXISTS "Subscriptions are updatable by organization owners/admins" ON public.subscriptions;

-- Ensure RLS is active
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Note:
-- 1. "Subscriptions are viewable by members of the organization" policy allows members to view (SELECT) their subscription.
-- 2. Initial subscription creation on organization insert is handled by public.handle_new_organization_subscription() (SECURITY DEFINER).
-- 3. All subsequent modifications are strictly processed by the FastSpring webhook using service_role permissions.
