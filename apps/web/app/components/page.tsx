import { Catalog } from "@/components/catalog/Catalog";

export default function ComponentsPage() {
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

        <Catalog />
      </div>
    </main>
  );
}