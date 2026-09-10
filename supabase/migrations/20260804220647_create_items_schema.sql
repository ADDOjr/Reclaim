/*
# Create lost & found items schema

1. New Tables
- `items`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user, references auth.users with cascade delete)
  - `type` (text, not null) — either 'lost' or 'found'
  - `title` (text, not null) — item name
  - `category` (text, not null) — e.g. Electronics, Clothing, Bags
  - `color` (text, not null) — primary color
  - `brand` (text) — brand/manufacturer, optional
  - `date_event` (date, not null) — date lost or date found
  - `location` (text, not null) — location where item was lost/found
  - `description` (text, not null) — free-text description used for keyword matching
  - `photo_urls` (text[]) — array of Supabase Storage public URLs for uploaded photos
  - `status` (text, not null, default 'active') — 'active' or 'resolved'
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `items`.
- Owner-scoped CRUD: each authenticated user can only insert/update/delete rows they own.
- SELECT is open to all authenticated users so people can see and match against items reported by others.
- Owner column defaults to `auth.uid()` so inserts that omit `user_id` still satisfy the INSERT policy.

3. Notes
- All items (lost and found) from all users are visible to every signed-in user so the AI matching
  feature can compare a user's lost item against everyone's found items and vice-versa.
- Users can only modify or delete their own reports.
- A `updated_at` trigger keeps the timestamp current on every update.
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('lost', 'found')),
  title text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  brand text,
  date_event date NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  photo_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can see all items (needed for cross-user matching)
DROP POLICY IF EXISTS "select_all_items" ON items;
CREATE POLICY "select_all_items" ON items FOR SELECT
  TO authenticated USING (true);

-- Users can only insert their own items
DROP POLICY IF EXISTS "insert_own_items" ON items;
CREATE POLICY "insert_own_items" ON items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
DROP POLICY IF EXISTS "update_own_items" ON items;
CREATE POLICY "update_own_items" ON items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own items
DROP POLICY IF EXISTS "delete_own_items" ON items;
CREATE POLICY "delete_own_items" ON items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for common queries
CREATE INDEX IF NOT EXISTS items_type_idx ON items (type);
CREATE INDEX IF NOT EXISTS items_status_idx ON items (status);
CREATE INDEX IF NOT EXISTS items_category_idx ON items (category);
CREATE INDEX IF NOT EXISTS items_user_id_idx ON items (user_id);

-- Storage bucket for item photos (public so matched items can display photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload; everyone can read (public bucket)
DROP POLICY IF EXISTS "Anyone can read item photos" ON storage.objects;
CREATE POLICY "Anyone can read item photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'item-photos');

DROP POLICY IF EXISTS "Authenticated can upload item photos" ON storage.objects;
CREATE POLICY "Authenticated can upload item photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'item-photos');

DROP POLICY IF EXISTS "Authenticated can update own item photos" ON storage.objects;
CREATE POLICY "Authenticated can update own item photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'item-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'item-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "Authenticated can delete own item photos" ON storage.objects;
CREATE POLICY "Authenticated can delete own item photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'item-photos' AND owner = auth.uid());