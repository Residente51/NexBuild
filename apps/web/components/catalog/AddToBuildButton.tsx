"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useBuildStore } from "@/store/useBuildStore";
import type {
  BuildSelection,
  PCComponent,
  StorageComponent,
} from "@/types/component";

interface AddToBuildButtonProps {
  component: PCComponent;
}

export function AddToBuildButton({ component }: AddToBuildButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const setComponent = useBuildStore((state) => state.setComponent);
  const addStorage = useBuildStore((state) => state.addStorage);

  async function handleAdd() {
    if (component.inStock === false || isAdding) return;

    setIsAdding(true);
    await Promise.resolve(useBuildStore.persist.rehydrate()).catch(
      () => undefined,
    );

    if (component.category === "storage") {
      addStorage(component as StorageComponent);
    } else {
      setComponent(
        component.category as Exclude<keyof BuildSelection, "storage">,
        component,
      );
    }

    router.push("/builder");
  }

  return (
    <Button
      onClick={() => void handleAdd()}
      disabled={component.inStock === false || isAdding}
      aria-busy={isAdding}
      className="w-full sm:w-auto"
    >
      {component.inStock === false
        ? "Sin stock"
        : isAdding
          ? "Agregando..."
          : "Agregar al armado"}
    </Button>
  );
}
