import { Hero } from "../components/sections/Hero";
import { ComponentCard } from "@/components/catalog/ComponentCard";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

export default async function Home() {
  // Fetch from Supabase (single source of truth)
  const result = await fetchCatalogFromSupabase();
  const components = result.success ? result.data : [];

  return (
    <>
      <Hero />

      <section className="bg-black px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-4xl font-black text-white">
            Componentes destacados
          </h2>

          {components.length === 0 ? (
            <div className="py-8 text-center text-white/60">
              <p>El catálogo está siendo poblado. Intenta más tarde.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {components.slice(0, 8).map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}