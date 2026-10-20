-- Migration: Enable Supabase Realtime for subscriptions table
-- Allows client-side listeners to instantly reflect webhook updates (plan upgrades, cancellations, renewals)

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
