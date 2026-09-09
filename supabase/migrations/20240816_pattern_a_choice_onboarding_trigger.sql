-- ============================================================================
-- Pattern A: Choice Screen Trigger Migration
-- Do NOT auto-accept pending invitations on signup.
-- Allow user to choose to Accept or Decline during Onboarding.
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_organization_id UUID;
    user_name TEXT;
    pending_invite RECORD;
    base_slug TEXT;
    final_slug TEXT;
BEGIN
    -- Safely extract full_name/name from Google OAuth or email metadata
    user_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
        NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
        'User'
    );

    -- Check if user email has an active pending invitation
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        SELECT * INTO pending_invite
        FROM public.invitations
        WHERE lower(email) = lower(NEW.email)
          AND status = 'pending'
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF pending_invite IS NOT NULL THEN
        -- Pattern A: Do NOT auto-accept invitation or auto-assign to org.
        -- Create un-onboarded profile without organization_id yet so the user can choose in Onboarding:
        -- 1) Accept invitation & join organization
        -- 2) Decline invitation & create own workspace
        INSERT INTO public.profiles (
            id,
            organization_id,
            email,
            full_name,
            role,
            onboarding_completed
        ) VALUES (
            NEW.id,
            NULL,
            COALESCE(NEW.email, ''),
            user_name,
            'member',
            false
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            onboarding_completed = false;

    ELSE
        -- Standard standalone signup: Create a new default organization for the user
        base_slug := lower(trim(both '-' from regexp_replace(COALESCE(NEW.email, NEW.id::text), '[^a-zA-Z0-9]+', '-', 'g')));
        IF base_slug IS NULL OR base_slug = '' THEN
            base_slug := 'user';
        END IF;
        final_slug := base_slug || '-' || substring(replace(NEW.id::text, '-', ''), 1, 8);

        INSERT INTO public.organizations (name, slug, plan)
        VALUES (
            user_name || '''s Organization',
            final_slug,
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
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
