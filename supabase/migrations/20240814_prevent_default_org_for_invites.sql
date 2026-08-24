-- ============================================================================
-- Prevent Default Organization Creation for Invited Users
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_organization_id UUID;
    user_name TEXT;
    pending_invite RECORD;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- Check if user email has a pending invitation
    SELECT * INTO pending_invite
    FROM public.invitations
    WHERE lower(email) = lower(NEW.email)
      AND status = 'pending'
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF pending_invite IS NOT NULL THEN
        -- Link user profile directly to invited organization and role
        INSERT INTO public.profiles (
            id,
            organization_id,
            email,
            full_name,
            role,
            onboarding_completed
        ) VALUES (
            NEW.id,
            pending_invite.organization_id,
            COALESCE(NEW.email, ''),
            user_name,
            pending_invite.role,
            true
        )
        ON CONFLICT (id) DO UPDATE
        SET organization_id = EXCLUDED.organization_id,
            role = EXCLUDED.role,
            email = EXCLUDED.email,
            onboarding_completed = true;

        -- Mark invitation as accepted
        UPDATE public.invitations
        SET status = 'accepted'
        WHERE id = pending_invite.id;

    ELSE
        -- Standard standalone signup: Create a new organization for the user
        INSERT INTO public.organizations (name, slug, plan)
        VALUES (
            user_name || "'s Organization",
            lower(regexp_replace(COALESCE(NEW.email, NEW.id::text), '[^a-zA-Z0-9]+', '-', 'g')),
            'free'
        )
        RETURNING id INTO new_organization_id;

        -- Create profile linking user to their new organization as owner
        INSERT INTO public.profiles (
            id,
            organization_id,
            email,
            full_name,
            role,
            onboarding_completed
        ) VALUES (
            NEW.id,
            new_organization_id,
            COALESCE(NEW.email, ''),
            user_name,
            'owner',
            false
        )
        ON CONFLICT (id) DO UPDATE
        SET organization_id = EXCLUDED.organization_id,
            email = EXCLUDED.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
