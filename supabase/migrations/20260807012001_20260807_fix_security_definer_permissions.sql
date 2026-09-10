/*
# Fix SECURITY DEFINER function execution permissions

1. Modified Functions
- `handle_new_user()` — trigger function that auto-creates a profile on signup.
  Should ONLY be called by the database trigger, never via RPC.
  Revoked EXECUTE from anon and authenticated.
- `update_updated_at()` — trigger function that updates the updated_at timestamp.
  Should ONLY be called by the database trigger, never via RPC.
  Revoked EXECUTE from anon and authenticated.
- `is_admin()` — helper used in RLS policies on claims and profiles.
  Revoked EXECUTE from anon (unauthenticated users should never call it).
  Retained EXECUTE for authenticated (required for RLS policy evaluation).

2. Security
- All three functions retain `SET search_path = public` (fixes search_path mutable warnings).
- Trigger functions are now not callable via the REST API by any role.
- is_admin() is not callable by unauthenticated users.
*/
-- Revoke EXECUTE from anon and authenticated on trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated;

-- Revoke EXECUTE from anon on is_admin (authenticated needs it for RLS policy evaluation)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
