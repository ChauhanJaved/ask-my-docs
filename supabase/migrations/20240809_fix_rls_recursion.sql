-- Fix infinite recursion in RLS policies for profiles and organizations tables

-- 1. Helper function to retrieve the user's organization ID safely without triggering RLS recursion
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Drop recursion-causing policies
DROP POLICY IF EXISTS "Profiles are viewable by members of the same organization" ON profiles;
DROP POLICY IF EXISTS "Organizations are viewable by members of the organization" ON organizations;
DROP POLICY IF EXISTS "Organizations are updatable by organization owners" ON organizations;
DROP POLICY IF EXISTS "Organizations are deletable by organization owners" ON organizations;

-- 3. Re-create non-recursive policy on profiles
CREATE POLICY "Profiles are viewable by self or org members"
ON profiles FOR SELECT
USING (
    id = auth.uid() OR organization_id = get_auth_user_org_id()
);

-- 4. Re-create non-recursive policies on organizations
CREATE POLICY "Organizations are viewable by members of the organization"
ON organizations FOR SELECT
USING (
    id = get_auth_user_org_id()
);

CREATE POLICY "Organizations are updatable by organization owners"
ON organizations FOR UPDATE
USING (
    id = get_auth_user_org_id() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Organizations are deletable by organization owners"
ON organizations FOR DELETE
USING (
    id = get_auth_user_org_id() AND EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
);
