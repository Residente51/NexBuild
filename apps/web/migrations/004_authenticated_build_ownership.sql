-- Authenticated build ownership and history support.
-- Existing anonymous rows keep user_id = NULL and are not rewritten.

BEGIN;

ALTER TABLE public.saved_builds
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.saved_builds
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE public.saved_builds
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.saved_builds
  DROP CONSTRAINT IF EXISTS saved_builds_name_trimmed_length_check;
ALTER TABLE public.saved_builds
  ADD CONSTRAINT saved_builds_name_trimmed_length_check CHECK (
    name IS NULL OR (
      name = btrim(name)
      AND char_length(name) BETWEEN 1 AND 80
      AND name !~ '[[:cntrl:]]'
    )
  );

DO $$
DECLARE
  constraint_name name;
BEGIN
  FOR constraint_name IN
    SELECT constraint_row.conname
    FROM pg_constraint AS constraint_row
    JOIN pg_attribute AS column_row
      ON column_row.attrelid = constraint_row.conrelid
      AND column_row.attnum = ANY (constraint_row.conkey)
    WHERE constraint_row.conrelid = 'public.saved_builds'::regclass
      AND constraint_row.confrelid = 'auth.users'::regclass
      AND constraint_row.contype = 'f'
      AND array_length(constraint_row.conkey, 1) = 1
      AND column_row.attname = 'user_id'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.saved_builds DROP CONSTRAINT %I',
      constraint_name
    );
  END LOOP;
END;
$$;
ALTER TABLE public.saved_builds
  ADD CONSTRAINT saved_builds_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS saved_builds_owner_history_idx
  ON public.saved_builds (user_id, updated_at DESC)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_saved_build_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_saved_build_updated_at ON public.saved_builds;
CREATE TRIGGER set_saved_build_updated_at
  BEFORE UPDATE ON public.saved_builds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_saved_build_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_saved_build_ownership_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'saved build ownership cannot be reassigned'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_saved_build_ownership_reassignment
  ON public.saved_builds;
CREATE TRIGGER prevent_saved_build_ownership_reassignment
  BEFORE UPDATE OF user_id ON public.saved_builds
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_saved_build_ownership_reassignment();

ALTER TABLE public.saved_builds ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_name name;
BEGIN
  FOR policy_name IN
    SELECT policy_row.policyname
    FROM pg_catalog.pg_policies AS policy_row
    WHERE policy_row.schemaname = 'public'
      AND policy_row.tablename = 'saved_builds'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.saved_builds',
      policy_name
    );
  END LOOP;
END;
$$;

CREATE POLICY "Users can read own builds"
  ON public.saved_builds FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own builds"
  ON public.saved_builds FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own builds"
  ON public.saved_builds FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

REVOKE ALL PRIVILEGES ON TABLE public.saved_builds
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES
  (id, user_id, build_data, total_price, created_at, name, updated_at)
  ON TABLE public.saved_builds
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT ON TABLE public.saved_builds TO service_role;
GRANT SELECT, DELETE ON TABLE public.saved_builds TO authenticated;
GRANT UPDATE (name) ON TABLE public.saved_builds TO authenticated;

COMMIT;
