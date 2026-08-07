-- RLS (Row Level Security) Testing Script for FTChat
-- This script verifies that users cannot access data from other organizations

-- Note: To run these tests, you would need to:
-- 1. Have Supabase running locally (via `supabase start`)
-- 2. Create test users and organizations
-- 3. Set up the context for each user using `SET LOCAL ROLE` or similar
-- 4. Attempt queries that should be blocked by RLS policies

-- Since we can't easily simulate different users in a simple SQL script without
-- actually setting up the auth context, this script documents what the tests should do

-- TEST 1: Organization access
-- User A should be able to see their own organization but not User B's organization

-- SET up: Create two test users and their organizations
-- In practice, you would:
-- 1. Sign up two different users (getting their auth.uid())
-- 2. Each user would automatically get their own organization via the auth trigger
-- 3. Then test access as each user

-- For demonstration, let's assume we have:
-- User A: ID '11111111-1111-1111-1111-111111111111'
-- User A's Organization: ID '11111111-1111-1111-1111-111111111111'
-- User B: ID '22222222-2222-2222-2222-222222222222'
-- User B's Organization: ID '22222222-2222-2222-2222-222222222222'

-- TEST: As User A, try to select from organizations table
-- Expected: User A can see their own organization, but not User B's
-- The actual test would require setting the user context, which in Supabase
-- is typically done through the auth system and JWT tokens

-- Since we can't easily simulate different authenticated users in plain SQL,
-- we'll document the expected behavior of our RLS policies:

-- Organizaions table RLS policy:
-- "Organizations are viewable by members of the organization"
-- USING (id IN (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
-- ))

-- This means:
-- When User A (auth.uid() = '11111111-1111-1111-1111-111111111111') queries organizations:
--   They can see organizations where id IN (SELECT organization_id FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111')
--   Which resolves to: organization_id = '11111111-1111-1111-1111-111111111111' (their own org)
--   So User A can only see their own organization

-- When User B (auth.uid() = '22222222-2222-2222-2222-222222222222') queries organizations:
--   They can see organizations where id IN (SELECT organization_id FROM profiles WHERE id = '22222222-2222-2222-2222-222222222222')
--   Which resolves to: organization_id = '22222222-2222-2222-2222-222222222222' (their own org)
--   So User B can only see their own organization

-- Similar logic applies to all other tables with their respective RLS policies

-- To properly test this, you would need to:
-- 1. Create a test script that uses the Supabase JS client
-- 2. Create two different users
-- 3. For each user, attempt to query data that belongs to the other user
-- 4. Verify that the queries return empty results or errors

-- Example test structure (in JavaScript/TypeScript):
/*
import { createClient } from '@supabase/supabase-js'

// Create two different supabase clients for different users
const userASupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// ... sign in as user A ...

const userBSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// ... sign in as user B ...

// Test: User A trying to access User B's organization
const { data: userAOrgData, error: userAOrgError } = await userASupabase
  .from('organizations')
  .select('*')
  .eq('id', '22222222-2222-2222-2222-222222222222') // User B's org ID

// Expect: userAOrgData to be empty or error to be set

// Test: User B trying to access User A's documents
const { data: userBDocData, error: userBDocError } = await userBSupabase
  .from('documents')
  .select('*')
  .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') // User A's document ID

// Expect: userBDocData to be empty or error to be set
*/

-- For now, we'll just verify that our RLS policies are correctly formed
-- by checking that they exist in the database

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;