-- ============================================================================
-- Fix Profile Role Update Trigger for Service Role & Team Invitations
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- If role is changing
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Allow role change if:
        -- 1. Executed by Supabase service_role (backend admin client)
        -- 2. User was not in an organization previously (OLD.organization_id IS NULL)
        -- 3. User is joining/changing organization (e.g. accepting a team invitation)
        -- 4. The user executing the change is an Org Owner
        IF (auth.role() = 'service_role') OR 
           (OLD.organization_id IS NULL) OR
           (NEW.organization_id IS DISTINCT FROM OLD.organization_id) OR
           public.is_org_owner() THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Only workspace Owners can change member roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
