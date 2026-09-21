"use client";

import Image from "next/image";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { PCComponent } from "@/types/component";

export function ComponentThumbnail({
  component,
  className = "h-16 w-16",
}: {
  component: PCComponent;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string>();

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#111119] ${className}`}
    >
      {component.image && failedSource !== component.image ? (
        <Image
          src={component.image}
          alt={`${component.name} de ${component.brand}`}
          fill
          sizes="96px"
          unoptimized
          className="object-contain p-2"
          onError={() => setFailedSource(component.image)}
        />
      ) : (
        <div className="px-2 text-center">
          <p className="text-[10px] font-black tracking-[0.12em] text-sky-200">
            {component.category.toUpperCase()}
          </p>
          <p className="mt-1 text-[9px] leading-tight text-white/40">
            {CATEGORY_LABELS[component.category]}
          </p>
        </div>
      )}
    </div>
  );
}
