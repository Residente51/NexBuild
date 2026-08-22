import { describe, it, expect } from "vitest";
import { evaluateBuild } from "@/lib/compatibility/engine";
import {
  cpuRyzen7_7700X,
  cpuIntelI5_13600K,
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

  it("estima un wattage total razonable", () => {
    const report = evaluateBuild(perfectBuild);
    // CPU TDP 105W + GPU (500 * 0.65 = 325W) + 100W overhead = 530W
    expect(report.totalWattageEstimated).toBe(530);
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
