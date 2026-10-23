import { describe, expect, it } from "vitest";
import { getCandidateCompatibilityPreview } from "@/lib/build/candidateCompatibility";
import type {
  BuildSelection,
  CPUComponent,
  MotherboardComponent,
  RAMComponent,
  StorageComponent,
} from "@/types/component";

const cpu: CPUComponent = {
  id: "cpu-am5",
  slug: "cpu-am5",
  name: "CPU AM5",
  brand: "Test",
  category: "cpu",
  price: 200_000,
  inStock: true,
  specs: {
    socket: "AM5",
    tdp: 65,
    hasIntegratedGraphics: true,
    includesCooler: true,
  },
};

const motherboard: MotherboardComponent = {
  id: "board-am5",
  slug: "board-am5",
  name: "Board AM5",
  brand: "Test",
  category: "motherboard",
  price: 150_000,
  inStock: true,
  specs: {
    socket: "AM5",
    formFactor: "ATX",
    ramType: "ddr5",
    ramSlots: 4,
    m2Slots: 2,
    sataPorts: 4,
    maxRamSpeed: 6_000,
  },
};

const baseBuild: BuildSelection = {
  cpu,
  motherboard,
  storage: [],
};

describe("manual Builder candidate compatibility", () => {
  it("simula un reemplazo sin mutar el build real", () => {
    const incompatibleCpu: CPUComponent = {
      ...cpu,
      id: "cpu-am4",
      slug: "cpu-am4",
      name: "CPU AM4",
      specs: { ...cpu.specs!, socket: "AM4" },
    };

    const preview = getCandidateCompatibilityPreview(
      baseBuild,
      incompatibleCpu,
    );

    expect(preview.status).toBe("incompatible");
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CPU_MB_SOCKET_MISMATCH" }),
      ]),
    );
    expect(baseBuild.cpu).toBe(cpu);
  });

  it("conserva la advertencia RAM-speed del motor actual", () => {
    const fastRam: RAMComponent = {
      id: "ram-fast",
      slug: "ram-fast",
      name: "RAM DDR5 6400",
      brand: "Test",
      category: "ram",
      price: 90_000,
      inStock: true,
      specs: {
        ramType: "ddr5",
        modules: 2,
        capacityPerModule: 16,
        speed: 6_400,
      },
    };

    const preview = getCandidateCompatibilityPreview(baseBuild, fastRam);

    expect(preview.status).toBe("warning");
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "RAM_MB_SPEED_ABOVE_SUPPORTED" }),
      ]),
    );
  });

  it("marca compatible una opción sin incidencias relacionadas", () => {
    expect(getCandidateCompatibilityPreview(baseBuild, cpu)).toEqual({
      status: "compatible",
      issues: [],
    });
  });

  it("agrega almacenamiento solo en la simulación", () => {
    const storage: StorageComponent = {
      id: "storage-1",
      slug: "storage-1",
      name: "SSD",
      brand: "Test",
      category: "storage",
      price: 60_000,
      inStock: true,
      specs: {
        type: "nvme",
        formFactor: "m.2 2280",
        capacity: 1_000,
      },
    };

    expect(getCandidateCompatibilityPreview(baseBuild, storage).status).toBe(
      "compatible",
    );
    expect(baseBuild.storage).toEqual([]);
  });
});
