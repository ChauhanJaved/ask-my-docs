-- Migration: FastSpring Webhook Idempotency & Event Ordering
-- Prevents duplicate event processing from retries and out-of-order events on the same subscription

-- 1. Create table for tracking processed webhook events (idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY, -- event.id from FastSpring/Stripe
    provider TEXT NOT NULL DEFAULT 'fastspring',
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup/retention queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);

-- Enable RLS and lock down to service role only
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 2. Add last_event_timestamp column to subscriptions to guarantee monotonic event ordering
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS last_event_timestamp TIMESTAMPTZ;

