-- Non-destructive rollback for 004_authenticated_build_ownership.sql.
-- Build rows and the added name/updated_at columns are preserved.

BEGIN;

REVOKE ALL ON public.saved_builds FROM authenticated;
REVOKE ALL ON public.saved_builds FROM anon;

DROP POLICY IF EXISTS "Users can read own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can insert their own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can update own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can delete own builds" ON public.saved_builds;

DROP TRIGGER IF EXISTS prevent_saved_build_ownership_reassignment
  ON public.saved_builds;
DROP FUNCTION IF EXISTS public.prevent_saved_build_ownership_reassignment();

DROP TRIGGER IF EXISTS set_saved_build_updated_at ON public.saved_builds;
DROP FUNCTION IF EXISTS public.set_saved_build_updated_at();

DROP INDEX IF EXISTS public.saved_builds_owner_history_idx;

ALTER TABLE public.saved_builds
  DROP CONSTRAINT IF EXISTS saved_builds_name_trimmed_length_check;

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
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
