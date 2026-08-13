-- Add onboarding_completed column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Update existing profiles (if any) to have onboarding_completed = false
UPDATE profiles 
SET onboarding_completed = false 
WHERE onboarding_completed IS NULL;
