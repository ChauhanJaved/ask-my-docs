-- ============================================================================
-- Restrict Admins from removing other Admins Migration
-- ============================================================================

-- Helper function to check profile deletion permissions:
-- 1. Workspace Owner can delete Admins and Members (cannot delete Owner).
-- 2. Workspace Admin can delete Members (cannot delete Admins or Owners).
-- 3. Members cannot delete anyone.
CREATE OR REPLACE FUNCTION public.can_delete_profile(target_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT 
        (public.is_org_owner() AND target_role != 'owner')
        OR
        (public.get_auth_user_role() = 'admin' AND target_role = 'member');
$$;

DROP POLICY IF EXISTS "Profiles are deletable by org owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are deletable by authorized roles" ON profiles;

CREATE POLICY "Profiles are deletable by authorized roles"
ON profiles FOR DELETE
TO authenticated
USING (
    id = auth.uid() OR (
        organization_id = get_auth_user_org_id() AND 
        public.can_delete_profile(role)
    )
);
