"use client";

import { useMemo, useState } from "react";

import { SearchBar } from "@/components/ui/SearchBar";
import { components } from "@/data/components";

import { ComponentGrid } from "./ComponentGrid";
import { EmptyState } from "./EmptyState";

export function Catalog() {
  const [search, setSearch] = useState("");

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return components;

    return components.filter((component) =>
      [component.name, component.brand, component.category]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

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