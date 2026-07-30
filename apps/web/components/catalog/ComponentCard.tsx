import { Button } from "@/components/ui/Button";
import type { PCComponent } from "@/types/component";

interface ComponentCardProps {
  component: PCComponent;
}

export function ComponentCard({
  component,
}: ComponentCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
      <div className="flex h-48 items-center justify-center bg-zinc-800">
        <span className="text-7xl">🖥️</span>
      </div>

      <div className="space-y-4 p-6">
        <div>
          <p className="text-sm text-blue-400">
            {component.category}
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            {component.name}
          </h2>

          <p className="mt-1 text-zinc-400">
            {component.brand}
          </p>
        </div>

        <p className="text-3xl font-black text-white">
          ${component.price.toLocaleString("es-CL")}
        </p>

        <Button
          variant="primary"
          className="w-full"
        >
          Ver detalles
        </Button>
      </div>
    </article>
  );
}