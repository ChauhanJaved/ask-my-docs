-- Fix RLS policies on organizations and profiles to allow onboarding insertion and updates

-- 1. Ensure authenticated users can insert new organizations during onboarding
DROP POLICY IF EXISTS "Organizations are insertable by organization owners" ON organizations;
DROP POLICY IF EXISTS "Organizations are insertable by authenticated users" ON organizations;

CREATE POLICY "Organizations are insertable by authenticated users"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Ensure organization owners/members can update their organization
DROP POLICY IF EXISTS "Organizations are updatable by organization owners" ON organizations;

CREATE POLICY "Organizations are updatable by organization owners"
ON organizations FOR UPDATE
TO authenticated
USING (
    id = get_auth_user_org_id() 
    OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND organization_id = organizations.id
    )
);

-- 3. Ensure users can insert their own profile during onboarding fallback
DROP POLICY IF EXISTS "Profiles are insertable for own user ID" ON profiles;

CREATE POLICY "Profiles are insertable for own user ID"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 4. Ensure users can update their own profile during onboarding
DROP POLICY IF EXISTS "Profiles are updatable by organization members" ON profiles;
DROP POLICY IF EXISTS "Profiles are updatable by own user ID" ON profiles;

CREATE POLICY "Profiles are updatable by own user ID"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());
