import { describe, it, expect } from "vitest";
import { evaluateBuild } from "@/lib/compatibility/engine";
import {
  cpuRyzen7_7700X,
  mbMsiB650TomahawkWifi,
  mbGigabyteB760mDS3H,
  ramCorsairVengeanceDdr5,
  ramKingstonFuryDdr4,
  gpuRtx4080Super,
  gpuRtx4060,
  caseNzxtH6Flow,
  caseFractalTerra,
  psuCorsairRM850x,
  psuEvga450BR,
} from "@/lib/seedData";
import type { BuildSelection } from "@/types/component";

// ---------------------------------------------------------------------------
// 1. Build Perfecta — todo compatible, cero incidencias
// ---------------------------------------------------------------------------

describe("Build Perfecta", () => {
  const perfectBuild: BuildSelection = {
    cpu: cpuRyzen7_7700X, // AM5
    motherboard: mbMsiB650TomahawkWifi, // AM5, ATX, DDR5
    ram: ramCorsairVengeanceDdr5, // DDR5, 2 módulos
    gpu: gpuRtx4060, // 224mm, rec 500W
    storage: [],
    case: caseNzxtH6Flow, // ATX, maxGpu 365mm
    psu: psuCorsairRM850x, // 850W ATX
  };

  it("devuelve estado 'compatible'", () => {
    const report = evaluateBuild(perfectBuild);
    expect(report.status).toBe("compatible");
  });

  it("no genera ninguna incidencia", () => {
    const report = evaluateBuild(perfectBuild);
    expect(report.issues).toHaveLength(0);
  });

  it("estima un wattage total con sumatorias reales", () => {
    const report = evaluateBuild(perfectBuild);
    // CPU TDP 105W + GPU (500 * 0.65 = 325W) + MB 30W + RAM (2*3=6W)
    // + Storage 0 + Cooler 0 + Case 10W = 476W
    expect(report.totalWattageEstimated).toBe(476);
  });
});

// ---------------------------------------------------------------------------
// 2. Build Frankenstein — cruce deliberado de incompatibilidades
// ---------------------------------------------------------------------------

describe("Build Frankenstein", () => {
  const frankenBuild: BuildSelection = {
    cpu: cpuRyzen7_7700X, // AM5
    motherboard: mbGigabyteB760mDS3H, // LGA1700, Micro-ATX, DDR4
    ram: ramKingstonFuryDdr4, // DDR4, 2 módulos
    gpu: gpuRtx4080Super, // 342mm, rec 750W
    storage: [],
    case: caseFractalTerra, // Mini-ITX, maxGpu 322mm, SFX only
    psu: psuEvga450BR, // 450W ATX
  };

  const report = evaluateBuild(frankenBuild);

  it("devuelve estado 'incompatible'", () => {
    expect(report.status).toBe("incompatible");
  });

  it("detecta el desajuste de socket CPU ↔ Motherboard", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CPU_MB_SOCKET_MISMATCH" }),
      ]),
    );
  });

  it("detecta que la placa Micro-ATX no cabe en el case Mini-ITX", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MB_CASE_FORMFACTOR_MISMATCH" }),
      ]),
    );
  });

  it("detecta que la GPU es demasiado larga para el case", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "GPU_CASE_LENGTH_EXCEEDED" }),
      ]),
    );
  });

  it("detecta que la fuente ATX no entra en un case SFX", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PSU_CASE_FORMFACTOR_MISMATCH" }),
      ]),
    );
  });

  it("detecta que el wattage de la fuente es insuficiente", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PSU_WATTAGE_EXCEEDED" }),
      ]),
    );
  });

  it("NO detecta un error de tipo de RAM (DDR4 + placa DDR4 = correcto)", () => {
    // La RAM DDR4 ES compatible con la B760M DDR4, así que esta regla
    // no debe dispararse, incluso en una build desastrosa.
    expect(report.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "RAM_MB_TYPE_MISMATCH" }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Build Vacía — sin componentes seleccionados
// ---------------------------------------------------------------------------

describe("Build Vacía", () => {
  const emptyBuild: BuildSelection = {
    cpu: undefined,
    motherboard: undefined,
    ram: undefined,
    gpu: undefined,
    storage: [],
    case: undefined,
    psu: undefined,
    cooler: undefined,
  };

  const report = evaluateBuild(emptyBuild);

  it("devuelve estado 'incomplete'", () => {
    expect(report.status).toBe("incomplete");
  });

  it("detecta que falta CPU", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_CPU" }),
      ]),
    );
  });

  it("detecta que falta motherboard", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_MOTHERBOARD" }),
      ]),
    );
  });

  it("detecta que falta PSU", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_PSU" }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Build Incompleta — componentes esenciales pero sin specs
// ---------------------------------------------------------------------------

describe("Build Incompleta (falta specs)", () => {
  const incompleteSpecsBuild: BuildSelection = {
    cpu: {
      id: "cpu-incomplete",
      slug: "cpu-no-specs",
      name: "Processor Without Specs",
      brand: "TestBrand",
      category: "cpu",
      price: 100,
      specs: undefined,
    },
    motherboard: {
      id: "mb-incomplete",
      slug: "mb-no-specs",
      name: "Motherboard Without Specs",
      brand: "TestBrand",
      category: "motherboard",
      price: 200,
      specs: {
        socket: "", // Falta socket válido
        formFactor: "ATX",
        ramType: "ddr5",
        ramSlots: 4,
        m2Slots: 2,
        sataPorts: 4,
      },
    },
    ram: undefined,
    gpu: undefined,
    storage: [],
    case: undefined,
    psu: {
      id: "psu-incomplete",
      slug: "psu-no-wattage",
      name: "PSU Without Wattage",
      brand: "TestBrand",
      category: "psu",
      price: 150,
      specs: {
        wattage: 0, // Falta wattage válido
        formFactor: "atx",
      },
    },
    cooler: undefined,
  };

  const report = evaluateBuild(incompleteSpecsBuild);

  it("devuelve estado 'incomplete' cuando faltan specs críticas", () => {
    expect(report.status).toBe("incomplete");
  });

  it("detecta que CPU no tiene specs definidas", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_CPU_SOCKET" }),
      ]),
    );
  });

  it("detecta que motherboard no tiene socket definido", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_MB_SOCKET" }),
      ]),
    );
  });

  it("detecta que PSU no tiene wattage definido", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_PSU_WATTAGE" }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Build Parcial — solo CPU y Motherboard (componentes opcionales faltan)
// ---------------------------------------------------------------------------

describe("Build Parcial (componentes opcionales faltan)", () => {
  const partialBuild: BuildSelection = {
    cpu: cpuRyzen7_7700X,
    motherboard: mbMsiB650TomahawkWifi,
    ram: undefined,
    gpu: undefined,
    storage: [],
    case: undefined,
    psu: undefined,
    cooler: undefined,
  };

  const report = evaluateBuild(partialBuild);

  it("devuelve estado 'incomplete' si faltan PSU o case", () => {
    expect(report.status).toBe("incomplete");
  });

  it("detecta que falta PSU", () => {
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_PSU" }),
      ]),
    );
  });
});
