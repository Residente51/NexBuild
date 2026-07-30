import { Navbar } from "../components/layout/Navbar";
import { Hero } from "../components/sections/Hero";

import { ComponentCard } from "@/components/catalog/ComponentCard";
import { components } from "@/data/components";

export default function Home() {
  return (
    <>
      <Navbar />

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