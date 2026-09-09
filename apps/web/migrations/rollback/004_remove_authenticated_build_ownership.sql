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

ALTER TABLE public.saved_builds
  DROP CONSTRAINT IF EXISTS saved_builds_user_id_fkey;
ALTER TABLE public.saved_builds
  ADD CONSTRAINT saved_builds_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
