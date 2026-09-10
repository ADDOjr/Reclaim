/*
# Fix auth trigger and helper functions

1. Modified Functions
- `handle_new_user()` — added `search_path = public` to the SECURITY DEFINER function.
  Without an explicit search_path, the trigger that auto-creates a profile on signup
  could fail to resolve the `profiles` table, causing a 500 "Database error saving new user"
  on every signup attempt.
- `is_admin()` — added `search_path = public` for the same reason.
- `update_updated_at()` — added `search_path = public` for consistency.

2. Security
- No policy changes. Only fixing function search_path to resolve signup failures.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
