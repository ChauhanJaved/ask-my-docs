-- Migration: Add billing_interval, price_display, currency to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS billing_interval TEXT,
ADD COLUMN IF NOT EXISTS price_display TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT;
