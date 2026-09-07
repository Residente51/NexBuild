-- Quarantine store listings fabricated by the legacy seed script.
-- Original values are backed up so this data migration is reversible.

BEGIN;

CREATE TABLE IF NOT EXISTS public.migration_003_generated_listing_backup (
  listing_id uuid PRIMARY KEY REFERENCES public.store_listings(id) ON DELETE CASCADE,
  product_url text,
  in_stock boolean NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.migration_003_generated_listing_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.migration_003_generated_listing_backup FROM anon, authenticated;
GRANT ALL ON public.migration_003_generated_listing_backup TO service_role;

INSERT INTO public.migration_003_generated_listing_backup (
  listing_id,
  product_url,
  in_stock
)
SELECT
  id,
  product_url,
  in_stock
FROM public.store_listings
WHERE product_url ~* '^https://www\.(spdigital|pcfactory)\.cl/producto/'
ON CONFLICT (listing_id) DO NOTHING;

UPDATE public.store_listings AS listing
SET
  product_url = NULL,
  in_stock = false,
  updated_at = now()
FROM public.migration_003_generated_listing_backup AS backup
WHERE listing.id = backup.listing_id
  AND listing.product_url ~* '^https://www\.(spdigital|pcfactory)\.cl/producto/';

COMMIT;
