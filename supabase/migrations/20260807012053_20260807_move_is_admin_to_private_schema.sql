/*
# Move is_admin() to private schema to prevent REST API access

1. New Schema
- `private` — non-exposed schema. Functions here are NOT available via the REST API
  (only the `public` schema is exposed via PostgREST), so they cannot be called directly
  by anon or authenticated users. RLS policies can still reference them.

2. Modified Functions
- `is_admin()` — moved from `public` to `private` schema. SECURITY DEFINER, SET search_path = public.
  Used in RLS policies on claims and profiles tables. SECURITY DEFINER is required to avoid
  recursion (is_admin reads profiles, which has an RLS policy that calls is_admin).
  Being in the private schema means it's not callable via /rest/v1/rpc by any role.

3. Modified Policies
- All RLS policies that referenced `is_admin()` now reference `private.is_admin()`:
  - claims: select_claims, update_claims, delete_claims_admin
  - profiles: select_own_or_admin_profiles (already doesn't call is_admin directly, uses subquery)

4. Security
- is_admin() is no longer callable via the REST API by anon or authenticated users.
- RLS policy evaluation still works because policies can reference functions in any schema.
*/
CREATE SCHEMA IF NOT EXISTS private;

-- Drop dependent policies first
DROP POLICY IF EXISTS "select_claims" ON claims;
DROP POLICY IF EXISTS "update_claims" ON claims;
DROP POLICY IF EXISTS "delete_claims_admin" ON claims;

-- Drop the old public.is_admin function (no longer has dependents)
DROP FUNCTION IF EXISTS public.is_admin();

-- Create is_admin in the private schema (not exposed via REST API)
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), false);
$$;

-- Recreate claims policies referencing private.is_admin()
CREATE POLICY "select_claims" ON claims FOR SELECT
  TO authenticated USING (
    claimer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid()) OR
    private.is_admin()
  );

CREATE POLICY "update_claims" ON claims FOR UPDATE
  TO authenticated USING (
    private.is_admin() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
  ) WITH CHECK (
    private.is_admin() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
  );

CREATE POLICY "delete_claims_admin" ON claims FOR DELETE
  TO authenticated USING (private.is_admin());
