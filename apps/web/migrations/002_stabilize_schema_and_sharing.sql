-- Upgrade path for projects that applied the original 001 migration.
-- This is additive and retry-safe; no product or build rows are deleted.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text NOT NULL UNIQUE,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  price_cash bigint NOT NULL DEFAULT 0,
  price_normal bigint,
  product_url text,
  in_stock boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, store_id)
);

CREATE TABLE IF NOT EXISTS public.saved_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  build_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_price bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.store_listings ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;
ALTER TABLE public.store_listings ADD COLUMN IF NOT EXISTS price_cash bigint NOT NULL DEFAULT 0;
ALTER TABLE public.store_listings ADD COLUMN IF NOT EXISTS price_normal bigint;
ALTER TABLE public.store_listings ADD COLUMN IF NOT EXISTS product_url text;
ALTER TABLE public.store_listings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.saved_builds ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.saved_builds ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_unique_idx
  ON public.stores (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_category_active_idx
  ON public.products (category, is_active);
CREATE INDEX IF NOT EXISTS store_listings_product_stock_price_idx
  ON public.store_listings (product_id, in_stock, price_cash);
CREATE INDEX IF NOT EXISTS saved_builds_created_at_idx
  ON public.saved_builds (created_at DESC);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can insert their own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can update own builds" ON public.saved_builds;
DROP POLICY IF EXISTS "Users can delete own builds" ON public.saved_builds;

DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read stores" ON public.stores;
CREATE POLICY "Public can read stores"
  ON public.stores FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can read listings" ON public.store_listings;
CREATE POLICY "Public can read listings"
  ON public.store_listings FOR SELECT TO anon, authenticated
  USING (true);

REVOKE ALL ON public.saved_builds FROM anon, authenticated;
GRANT SELECT ON public.products, public.stores, public.store_listings TO anon, authenticated;
GRANT ALL ON public.products, public.stores, public.store_listings, public.saved_builds TO service_role;

COMMIT;
