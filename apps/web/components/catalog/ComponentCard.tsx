import Link from "next/link";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { PCComponent } from "@/types/component";

interface ComponentCardProps {
  component: PCComponent;
}

export function ComponentCard({
  component,
}: ComponentCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-zinc-800">
        {component.image ? (
          <Image
            src={component.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-contain p-4"
          />
        ) : (
          <span aria-hidden="true" className="text-7xl">🖥️</span>
        )}
      </div>

      <div className="space-y-4 p-6">
        <div>
          <p className="text-sm text-blue-400">
            {CATEGORY_LABELS[component.category]}
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            {component.name}
          </h2>

          <p className="mt-1 text-zinc-400">
            {component.brand}
          </p>
        </div>

        <p className="text-3xl font-black tabular-nums text-white">
          {component.price > 0
            ? `$${component.price.toLocaleString("es-CL")}`
            : "Sin precio"}
        </p>

        {component.productUrl ? (
          <a
            href={component.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName("primary", "w-full")}
          >
            Ver oferta
          </a>
        ) : (
          <Link
            href="/components"
            className={buttonClassName("secondary", "w-full")}
          >
            Ver catálogo
          </Link>
        )}
      </div>
    </article>
  );
}
