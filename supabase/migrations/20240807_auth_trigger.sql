-- Create a function to handle new user sign ups
-- This function will be triggered after a user signs up
-- It creates an organization for the user and sets them as the owner

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_organization_id UUID;
BEGIN
    -- Create a new organization for the user
    INSERT INTO organizations (name, slug, plan)
    VALUES (
        NEW.email || "'s Organization",  -- Organization name based on email
        lower(replace(NEW.email, '[^a-zA-Z0-9]+', '-')),  -- Slug based on email
        'free'  -- Default plan
    )
    RETURNING id INTO new_organization_id;

    -- Create a profile entry linking the user to their organization
    INSERT INTO profiles (
        id,
        organization_id,
        email,
        full_name,
        role
    ) VALUES (
        NEW.id,  -- The user's ID from auth.users
        new_organization_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'owner'  -- New user is the owner of their organization
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that runs the function after a new user is created
-- Note: Supabase Auth doesn't directly support triggers on auth.users
-- Instead, we'll need to use a different approach or handle this in the application
-- For Supabase, we typically handle this in the application layer or using webhooks

-- However, we can create a trigger for demonstration purposes
-- In practice, with Supabase, you would:
-- 1. Either handle this in your sign up API route
-- 2. Or use a database webhook (though these have limitations)
-- 3. Or use the auth.uid() in RLS policies to infer the organization

-- Let's create a placeholder function showing the concept
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates organization and profile for new users';

-- Note: In a real Supabase implementation, you would typically handle organization creation
-- in your application's sign up flow rather than as a database trigger on auth.users
-- because auth.users is managed by Supabase and direct triggers have limitations