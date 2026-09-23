import type { Metadata } from "next";

import { CatalogView } from "@/components/catalog/CatalogView";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

export const metadata: Metadata = {
  title: "Catálogo de componentes",
  description:
    "Explora procesadores, tarjetas gráficas y otros componentes para armar tu PC.",
};

export const dynamic = "force-dynamic";

export default async function ComponentsPage() {
  const result = await fetchCatalogFromSupabase();

  return <CatalogView initialResult={result} />;
}
