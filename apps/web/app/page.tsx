import { Hero } from "../components/sections/Hero";
import { ComponentCard } from "@/components/catalog/ComponentCard";
import { fetchCatalogFromSupabase } from "@/lib/components/repository";

export default async function Home() {
  // Fetch from Supabase (single source of truth)
  const result = await fetchCatalogFromSupabase();
  const components = result.success ? result.data : [];
  const availableComponents = components.filter(
    (component) => component.inStock !== false,
  );

  return (
    <>
      <Hero
        componentCount={components.length}
        catalogError={result.success ? undefined : result.error}
      />

      <section className="bg-black px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-4xl font-black text-white">
            Componentes destacados
          </h2>

          {!result.success ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-6 py-8 text-center text-amber-100">
              <p>No pudimos cargar los componentes destacados.</p>
              <p className="mt-2 text-sm text-white/60">{result.error}</p>
            </div>
          ) : availableComponents.length === 0 ? (
            <div className="py-8 text-center text-white/60">
              <p>El catálogo está siendo poblado. Intenta más tarde.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {availableComponents.slice(0, 8).map((component) => (
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
