import type { Metadata } from "next";

import { ComparisonView } from "@/components/compare/ComparisonView";

export const metadata: Metadata = {
  title: "Comparar componentes",
  description:
    "Compara entre 2 y 4 componentes de la misma categoría y revisa sus diferencias.",
};

export default function ComparePage() {
  return <ComparisonView />;
}
