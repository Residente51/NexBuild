"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  hydrateComparisonStore,
  useComparisonStore,
  type ComparisonAddResult,
} from "@/store/useComparisonStore";
import type { PCComponent } from "@/types/component";

interface CompareButtonProps {
  component: Pick<PCComponent, "slug" | "category">;
  className?: string;
}

interface Feedback {
  kind: "success" | "error";
  message: string;
}

function getFailureMessage(
  result: Exclude<ComparisonAddResult, { success: true }>,
): string {
  switch (result.reason) {
    case "duplicate":
      return "Este componente ya está en la comparación.";
    case "mixed-category":
      return "Solo puedes comparar componentes de la misma categoría.";
    case "limit":
      return "Puedes comparar hasta 4 componentes.";
  }
}

export function CompareButton({
  component,
  className = "",
}: CompareButtonProps) {
  const items = useComparisonStore((state) => state.items);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const isSelected = items.some((item) => item.slug === component.slug);

  useEffect(() => {
    void hydrateComparisonStore().catch(() => undefined);
  }, []);

  async function handleCompare() {
    if (isSelected || isAdding) return;

    setIsAdding(true);
    setFeedback(null);

    try {
      await hydrateComparisonStore();
      const result = useComparisonStore.getState().addComponent({
        slug: component.slug,
        category: component.category,
      });

      setFeedback(
        result.success
          ? { kind: "success", message: "Componente añadido a la comparación." }
          : { kind: "error", message: getFailureMessage(result) },
      );
    } catch {
      setFeedback({
        kind: "error",
        message: "No pudimos guardar la selección de comparación.",
      });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <Button
        variant="secondary"
        onClick={() => void handleCompare()}
        disabled={isSelected || isAdding}
        aria-busy={isAdding}
        className="w-full px-4 py-2 text-sm"
      >
        {isSelected
          ? "En comparación"
          : isAdding
            ? "Agregando..."
            : "Comparar"}
      </Button>

      {(isSelected || feedback) && items.length > 0 && (
        <Link
          href="/compare"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-2 text-sm font-semibold text-[#38BDF8] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          Ir a comparar ({items.length})
        </Link>
      )}

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`text-xs ${
            feedback.kind === "error" ? "text-red-300" : "text-emerald-300"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
