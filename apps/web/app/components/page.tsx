import { CatalogView } from "@/components/catalog/CatalogView";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

export const dynamic = "force-dynamic";

export default async function ComponentsPage() {
  const result = await fetchCatalogFromSupabase();

  return <CatalogView initialResult={result} />;
}
