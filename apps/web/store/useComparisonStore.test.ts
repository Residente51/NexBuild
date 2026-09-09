import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_COMPARISON_ITEMS,
  useComparisonStore,
  type ComparisonReference,
} from "./useComparisonStore";

const cpu = (slug: string): ComparisonReference => ({
  slug,
  category: "cpu",
});

describe("useComparisonStore", () => {
  beforeEach(() => {
    useComparisonStore.getState().clearComparison();
  });

  it("agrega componentes de la misma categoría", () => {
    const store = useComparisonStore.getState();

    expect(store.addComponent(cpu("cpu-1"))).toEqual({ success: true });
    expect(store.addComponent(cpu("cpu-2"))).toEqual({ success: true });
    expect(useComparisonStore.getState().items).toHaveLength(2);
  });

  it("impide duplicados", () => {
    const store = useComparisonStore.getState();
    store.addComponent(cpu("cpu-1"));

    expect(store.addComponent(cpu("cpu-1"))).toEqual({
      success: false,
      reason: "duplicate",
    });
    expect(useComparisonStore.getState().items).toHaveLength(1);
  });

  it("impide mezclar categorías", () => {
    const store = useComparisonStore.getState();
    store.addComponent(cpu("cpu-1"));

    expect(
      store.addComponent({ slug: "gpu-1", category: "gpu" }),
    ).toEqual({
      success: false,
      reason: "mixed-category",
    });
  });

  it("limita la selección a cuatro componentes", () => {
    const store = useComparisonStore.getState();

    for (let index = 0; index < MAX_COMPARISON_ITEMS; index += 1) {
      expect(store.addComponent(cpu(`cpu-${index}`))).toEqual({
        success: true,
      });
    }

    expect(store.addComponent(cpu("cpu-extra"))).toEqual({
      success: false,
      reason: "limit",
    });
    expect(useComparisonStore.getState().items).toHaveLength(
      MAX_COMPARISON_ITEMS,
    );
  });

  it("permite quitar y limpiar la selección", () => {
    const store = useComparisonStore.getState();
    store.addComponent(cpu("cpu-1"));
    store.addComponent(cpu("cpu-2"));

    store.removeComponent("cpu-1");
    expect(useComparisonStore.getState().items).toEqual([cpu("cpu-2")]);

    store.clearComparison();
    expect(useComparisonStore.getState().items).toEqual([]);
  });
});
