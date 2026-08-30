-- Enable Row-Level Security on saved_builds table
-- Ensures: authentication required, users can only see/edit their own builds

-- Enable RLS on the table
ALTER TABLE saved_builds ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can read their own builds
CREATE POLICY "Users can read own builds"
  ON saved_builds FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Only authenticated users can insert their own builds
-- Prevents client-side manipulation of user_id or total_price
CREATE POLICY "Users can insert their own builds"
  ON saved_builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only authenticated users can update their own builds
CREATE POLICY "Users can update own builds"
  ON saved_builds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only authenticated users can delete their own builds
CREATE POLICY "Users can delete own builds"
  ON saved_builds FOR DELETE
  USING (auth.uid() = user_id);

-- Read-only view of components catalog (no client write access)
CREATE VIEW components_public AS
  SELECT id, slug, name, brand, category, price, description, specs
  FROM components
  WHERE is_active = true;

-- Grant read-only access to authenticated users on the view
GRANT SELECT ON components_public TO authenticated;

-- Deny any direct modifications to the catalog from authenticated users
REVOKE INSERT, UPDATE, DELETE ON components FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON components FROM anon;
