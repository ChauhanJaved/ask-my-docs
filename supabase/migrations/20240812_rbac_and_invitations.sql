-- ============================================================================
-- RBAC Security & Team Invitations Migration
-- ============================================================================

-- 1. Create Team Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    UNIQUE(organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Definer Functions
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'owner'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('owner', 'admin')
    );
$$;

-- 3. Trigger to prevent users from changing their own role unless they are the Owner
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- If role is changing
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only org owner can change roles
        IF NOT public.is_org_owner() THEN
            RAISE EXCEPTION 'Only workspace Owners can change member roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_profile_role_update ON profiles;
CREATE TRIGGER tr_check_profile_role_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_profile_role_update();

-- 4. RLS Policies for Invitations Table
DROP POLICY IF EXISTS "Invitations are viewable by org owners and admins" ON invitations;
CREATE POLICY "Invitations are viewable by org owners and admins"
ON invitations FOR SELECT
TO authenticated
USING (
    organization_id = get_auth_user_org_id() AND is_org_admin_or_owner()
);

DROP POLICY IF EXISTS "Invitations are insertable by org owners and admins" ON invitations;
CREATE POLICY "Invitations are insertable by org owners and admins"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
    organization_id = get_auth_user_org_id() AND is_org_admin_or_owner()
);

DROP POLICY IF EXISTS "Invitations are updatable by org owners and admins" ON invitations;
CREATE POLICY "Invitations are updatable by org owners and admins"
ON invitations FOR UPDATE
TO authenticated
USING (
    organization_id = get_auth_user_org_id() AND is_org_admin_or_owner()
)
WITH CHECK (
    organization_id = get_auth_user_org_id() AND is_org_admin_or_owner()
);

DROP POLICY IF EXISTS "Invitations are deletable by org owners and admins" ON invitations;
CREATE POLICY "Invitations are deletable by org owners and admins"
ON invitations FOR DELETE
TO authenticated
USING (
    organization_id = get_auth_user_org_id() AND is_org_admin_or_owner()
);

-- 5. Updated Profiles RLS for Deletion & Updates across team members
DROP POLICY IF EXISTS "Profiles are updatable by own user ID" ON profiles;
DROP POLICY IF EXISTS "Profiles are updatable by own user ID or org owner" ON profiles;
CREATE POLICY "Profiles are updatable by own user ID or org owner"
ON profiles FOR UPDATE
TO authenticated
USING (
    id = auth.uid() OR (organization_id = get_auth_user_org_id() AND is_org_owner())
)
WITH CHECK (
    id = auth.uid() OR (organization_id = get_auth_user_org_id() AND is_org_owner())
);

DROP POLICY IF EXISTS "Profiles are deletable by own user ID" ON profiles;
DROP POLICY IF EXISTS "Profiles are deletable by org owners and admins" ON profiles;
CREATE POLICY "Profiles are deletable by org owners and admins"
ON profiles FOR DELETE
TO authenticated
USING (
    id = auth.uid() OR (
        organization_id = get_auth_user_org_id() AND 
        is_org_admin_or_owner() AND 
        role != 'owner'
    )
);
