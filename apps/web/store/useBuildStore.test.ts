import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cpuRyzen7_7700X,
  storageNvme,
} from "@/lib/seedData";
import { useBuildStore } from "./useBuildStore";
import type { BuildSelection } from "@/types/component";

vi.mock("@/app/actions/saveBuild", () => ({
  saveBuild: vi.fn(),
}));

describe("useBuildStore", () => {
  beforeEach(() => {
    useBuildStore.getState().clearBuild();
  });

  it("elimina solo una instancia cuando hay almacenamiento duplicado", () => {
    const store = useBuildStore.getState();
    store.addStorage(storageNvme);
    store.addStorage(storageNvme);
    store.removeStorage(storageNvme.id);

    expect(useBuildStore.getState().build.storage).toHaveLength(1);
  });

  it("reconcilia snapshots persistidos con el precio actual del catálogo", () => {
    const store = useBuildStore.getState();
    store.setComponent("cpu", cpuRyzen7_7700X);
    store.reconcileCatalog([
      { ...cpuRyzen7_7700X, price: cpuRyzen7_7700X.price + 10_000 },
    ]);

    expect(useBuildStore.getState().build.cpu?.price).toBe(
      cpuRyzen7_7700X.price + 10_000,
    );
  });

  it("ignora snapshots con una categoría en el slot equivocado", () => {
    const invalidBuild = {
      storage: [],
      cpu: storageNvme,
    } as unknown as BuildSelection;

    useBuildStore.getState().loadBuild(invalidBuild);

    expect(useBuildStore.getState().build).toEqual({ storage: [] });
  });
});
