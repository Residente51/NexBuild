"use client";

import { useMemo, useState } from "react";

import { SearchBar } from "@/components/ui/SearchBar";
import { filterComponents } from "@/lib/components/search";
import type { PCComponent } from "@/types/component";

import { ComponentGrid } from "./ComponentGrid";
import { EmptyState } from "./EmptyState";

interface CatalogProps {
  components: PCComponent[];
}

export function Catalog({
  components,
}: CatalogProps) {
  const [search, setSearch] = useState("");

  const filteredComponents = useMemo(
    () => filterComponents(components, search),
    [components, search]
  );

  return (
    <>
      <div className="mb-10">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, marca o categoría..."
        />
      </div>

      {filteredComponents.length > 0 ? (
        <ComponentGrid components={filteredComponents} />
      ) : (
        <EmptyState search={search} />
      )}
    </>
  );
}