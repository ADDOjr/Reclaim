/*
# Add profiles, claims, notifications, and admin support

1. New Tables
- `profiles` — user profile with admin flag, notification preferences, phone
- `claims` — claim records linking a found item to a claimer with verification
- `notifications` — in-app notifications for matches, claims, and system events

2. Modified Tables
- `items` — added `building` (text) and `image_hash` (text) columns

3. Security
- RLS on all new tables with owner-scoped access and admin override via `is_admin()` function.
- Auto-creates profile on signup via trigger.

4. Notes
- To make a user an admin, set `is_admin = true` in their profile row.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  is_admin boolean NOT NULL DEFAULT false,
  notify_email boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  notify_inapp boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
CREATE POLICY "select_own_or_admin_profiles" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- is_admin() helper (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), false);
$$;

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  verification_answers jsonb NOT NULL DEFAULT '{}',
  proof_url text,
  admin_id uuid REFERENCES auth.users(id),
  admin_note text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_claims" ON claims;
CREATE POLICY "select_claims" ON claims FOR SELECT
  TO authenticated USING (
    claimer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid()) OR
    is_admin()
  );

DROP POLICY IF EXISTS "insert_own_claims" ON claims;
CREATE POLICY "insert_own_claims" ON claims FOR INSERT
  TO authenticated WITH CHECK (claimer_id = auth.uid());

DROP POLICY IF EXISTS "update_claims" ON claims;
CREATE POLICY "update_claims" ON claims FOR UPDATE
  TO authenticated USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR
    EXISTS (SELECT 1 FROM items WHERE items.id = claims.item_id AND items.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_claims_admin" ON claims;
CREATE POLICY "delete_claims_admin" ON claims FOR DELETE
  TO authenticated USING (is_admin());

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('match', 'claim', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- Add building and image_hash to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS building text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_hash text;

CREATE INDEX IF NOT EXISTS items_building_idx ON items (building);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS claims_item_id_idx ON claims (item_id);
CREATE INDEX IF NOT EXISTS claims_claimer_id_idx ON claims (claimer_id);
CREATE INDEX IF NOT EXISTS claims_status_idx ON claims (status);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();