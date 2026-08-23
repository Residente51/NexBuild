import { Hero } from "../components/sections/Hero";

import { ComponentCard } from "@/components/catalog/ComponentCard";
import { getAllComponents } from "@/lib/components/repository";

export default function Home() {
  const components = getAllComponents();

  return (
    <>
      <Hero />

      <section className="bg-black px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-8 text-4xl font-black text-white">
            Componentes destacados
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}