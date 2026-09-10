-- Migration: Add 'declined' to invitations status check constraint
-- Fixes constraint error when users decline an invitation during onboarding

ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_status_check;
ALTER TABLE invitations ADD CONSTRAINT invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked'));
