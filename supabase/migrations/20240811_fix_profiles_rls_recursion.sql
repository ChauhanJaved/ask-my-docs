-- Fix infinite recursion in profiles and organizations RLS policies
-- Remove old legacy/duplicate policies causing circular table subqueries

-- 1. Drop all existing SELECT, INSERT, UPDATE, DELETE policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by members of the same organization or ow" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by self or org members" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by members of the same organization" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by self" ON profiles;
DROP POLICY IF EXISTS "Profiles are updatable byorganization members" ON profiles;
DROP POLICY IF EXISTS "Profiles are updatable by organization members" ON profiles;
DROP POLICY IF EXISTS "Profiles are updatable by own user ID" ON profiles;
DROP POLICY IF EXISTS "Profiles are insertable for own user ID" ON profiles;
DROP POLICY IF EXISTS "Profiles are deletable by own user ID" ON profiles;

-- 2. Drop all existing policies on organizations
DROP POLICY IF EXISTS "Organizations are viewable by members of the organization" ON organizations;
DROP POLICY IF EXISTS "Organizations are insertable by organization owners" ON organizations;
DROP POLICY IF EXISTS "Organizations are insertable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by organization owners" ON organizations;
DROP POLICY IF EXISTS "Organizations are deletable by organization owners" ON organizations;

-- 3. Ensure get_auth_user_org_id is safely defined
CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 4. Re-create clean policies on profiles
CREATE POLICY "Profiles are viewable by self or org members"
ON profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR (organization_id IS NOT NULL AND organization_id = get_auth_user_org_id())
);

CREATE POLICY "Profiles are insertable for own user ID"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles are updatable by own user ID"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles are deletable by own user ID"
ON profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- 5. Re-create clean policies on organizations
CREATE POLICY "Organizations are viewable by members of the organization"
ON organizations FOR SELECT
TO authenticated
USING (id = get_auth_user_org_id());

CREATE POLICY "Organizations are insertable by authenticated users"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Organizations are updatable by organization owners"
ON organizations FOR UPDATE
TO authenticated
USING (id = get_auth_user_org_id())
WITH CHECK (id = get_auth_user_org_id());

CREATE POLICY "Organizations are deletable by organization owners"
ON organizations FOR DELETE
TO authenticated
USING (id = get_auth_user_org_id());
