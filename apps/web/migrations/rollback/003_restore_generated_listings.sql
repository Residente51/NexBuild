-- Reversible rollback for 003_quarantine_generated_listings.sql.

BEGIN;

UPDATE public.store_listings AS listing
SET
  product_url = backup.product_url,
  in_stock = backup.in_stock,
  updated_at = now()
FROM public.migration_003_generated_listing_backup AS backup
WHERE listing.id = backup.listing_id;

COMMIT;
