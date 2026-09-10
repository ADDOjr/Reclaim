/*
# Revoke PUBLIC EXECUTE on SECURITY DEFINER functions

1. Modified Functions
- `handle_new_user()` — trigger function, only called by the DB trigger. Revoked EXECUTE from PUBLIC.
- `update_updated_at()` — trigger function, only called by the DB trigger. Revoked EXECUTE from PUBLIC.
- `is_admin()` — used in RLS policies on claims and profiles. Revoked EXECUTE from PUBLIC.
  Retained EXECUTE for `authenticated` because RLS policies on claims/profiles call this function
  during query evaluation as the authenticated user; without EXECUTE, those policies would error.
  SECURITY DEFINER is required to avoid recursion (is_admin reads profiles, which has an RLS
  policy that calls is_admin).

2. Security
- Trigger functions are now not callable via REST API by any role.
- is_admin() is not callable by unauthenticated (anon) users.
*/
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
