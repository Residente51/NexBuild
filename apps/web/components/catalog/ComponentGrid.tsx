import { ComponentCard } from "@/components/catalog/ComponentCard";
import type { PCComponent } from "@/types/component";

interface ComponentGridProps {
  components: PCComponent[];
}

export function ComponentGrid({
  components,
}: ComponentGridProps) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {components.map((component) => (
        <ComponentCard
          key={component.id}
          component={component}
        />
      ))}
    </section>
  );
}