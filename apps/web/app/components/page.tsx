"use client";

import { useMemo, useState } from "react";

import { ComponentCard } from "@/components/catalog/ComponentCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { components } from "@/data/components";

export default function ComponentsPage() {
  const [search, setSearch] = useState("");

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return components;
    }

    return components.filter((component) =>
      [component.name, component.brand, component.category]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-black px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-5xl font-black text-white">
            Catálogo de Componentes
          </h1>

          <p className="mt-3 text-lg text-zinc-400">
            Explora nuestro catálogo de hardware para armar tu próximo PC.
          </p>
        </header>

        <div className="mb-10">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, marca o categoría..."
          />
        </div>

        {filteredComponents.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
              />
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <p className="text-lg text-zinc-400">
              No se encontraron componentes para{" "}
              <span className="text-white">{search}</span>.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}