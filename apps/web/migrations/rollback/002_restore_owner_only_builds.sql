-- Non-destructive rollback for 002_stabilize_schema_and_sharing.sql.
-- Data and added columns are preserved. Direct access is restored only for
-- authenticated owners; the server-only service role remains available.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_builds TO authenticated;
REVOKE ALL ON public.saved_builds FROM anon;

DROP POLICY IF EXISTS "Users can read own builds" ON public.saved_builds;
CREATE POLICY "Users can read own builds"
  ON public.saved_builds FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own builds" ON public.saved_builds;
CREATE POLICY "Users can insert their own builds"
  ON public.saved_builds FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own builds" ON public.saved_builds;
CREATE POLICY "Users can update own builds"
  ON public.saved_builds FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own builds" ON public.saved_builds;
CREATE POLICY "Users can delete own builds"
  ON public.saved_builds FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
