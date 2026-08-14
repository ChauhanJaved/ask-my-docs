-- Create a function to handle new user sign ups
-- This function will be triggered after a user signs up (Email or Google OAuth)
-- It creates an organization for the user and sets them as the owner

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_organization_id UUID;
    user_name TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- Create a new organization for the user
    INSERT INTO organizations (name, slug, plan)
    VALUES (
        user_name || "'s Organization",
        lower(replace(COALESCE(NEW.email, NEW.id::text), '[^a-zA-Z0-9]+', '-')),
        'free'
    )
    RETURNING id INTO new_organization_id;

    -- Create a profile entry linking the user to their organization
    INSERT INTO profiles (
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates organization and profile for new users upon auth signup';