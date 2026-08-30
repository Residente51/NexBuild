/**
 * Deterministic PC-build compatibility engine.
 *
 * Design principles:
 * - Pure functions only — no LLM, no network, no side-effects.
 * - Each rule is a `CompatibilityRule`: receives a `BuildSelection`,
 *   returns an array of `CompatibilityIssue` (empty = no problems).
 * - Adding a new rule is a single-line change in the `rules` array.
 */

import type {
  BuildSelection,
  BuildCompatibilityReport,
  CompatibilityIssue,
  CompatibilityRule,
  CompatibilityStatus,
  CPUComponent,
  GPUComponent,
} from "@/types/component";

// ---------------------------------------------------------------------------
// Individual validation rules
// ---------------------------------------------------------------------------

/** Build completeness — essential components and required specs. */
const checkBuildCompleteness: CompatibilityRule = (build) => {
  const issues: CompatibilityIssue[] = [];

  // Essential components missing
  if (!build.cpu) {
    issues.push({
      status: "incomplete",
      componentCategories: ["cpu"],
      message: "Se requiere un procesador (CPU) para evaluar compatibilidad.",
      code: "MISSING_CPU",
    });
  }

  if (!build.motherboard) {
    issues.push({
      status: "incomplete",
      componentCategories: ["motherboard"],
      message: "Se requiere una placa madre para evaluar compatibilidad.",
      code: "MISSING_MOTHERBOARD",
    });
  }

  if (!build.psu) {
    issues.push({
      status: "incomplete",
      componentCategories: ["psu"],
      message: "Se requiere una fuente de poder para evaluar el consumo del sistema.",
      code: "MISSING_PSU",
    });
  }

  // Check critical specs are present for evaluation
  if (build.cpu && (!build.cpu.specs?.socket || build.cpu.specs.socket === "")) {
    issues.push({
      status: "incomplete",
      componentCategories: ["cpu"],
      message: "El procesador no tiene especificaciones de socket definidas.",
      code: "MISSING_CPU_SOCKET",
    });
  }

  if (build.motherboard && (!build.motherboard.specs?.socket || build.motherboard.specs.socket === "")) {
    issues.push({
      status: "incomplete",
      componentCategories: ["motherboard"],
      message: "La placa madre no tiene especificaciones de socket definidas.",
      code: "MISSING_MB_SOCKET",
    });
  }

  if (build.motherboard && !build.motherboard.specs?.formFactor) {
    issues.push({
      status: "incomplete",
      componentCategories: ["motherboard"],
      message: "La placa madre no tiene especificaciones de factor de forma definidas.",
      code: "MISSING_MB_FORMFACTOR",
    });
  }

  if (build.ram && !build.ram.specs?.ramType) {
    issues.push({
      status: "incomplete",
      componentCategories: ["ram"],
      message: "La RAM no tiene especificaciones de tipo definidas.",
      code: "MISSING_RAM_TYPE",
    });
  }

  if (build.psu && (!build.psu.specs?.wattage || build.psu.specs.wattage === 0)) {
    issues.push({
      status: "incomplete",
      componentCategories: ["psu"],
      message: "La fuente no tiene especificaciones de wattage definidas.",
      code: "MISSING_PSU_WATTAGE",
    });
  }

  return issues;
};

/** CPU ↔ Motherboard — socket must match. */
const checkCpuMotherboardSocket: CompatibilityRule = (build) => {
  const { cpu, motherboard } = build;
  if (!cpu?.specs || !motherboard?.specs) return [];

  if (cpu.specs.socket !== motherboard.specs.socket) {
    return [
      {
        status: "incompatible",
        componentCategories: ["cpu", "motherboard"],
        message: `El procesador ${cpu.name} usa socket ${cpu.specs.socket}, pero la placa madre ${motherboard.name} usa socket ${motherboard.specs.socket}.`,
        code: "CPU_MB_SOCKET_MISMATCH",
      },
    ];
  }
  return [];
};

/** RAM ↔ Motherboard — DDR generation must match. */
const checkRamMotherboardType: CompatibilityRule = (build) => {
  const { ram, motherboard } = build;
  if (!ram?.specs || !motherboard?.specs) return [];

  if (ram.specs.ramType !== motherboard.specs.ramType) {
    return [
      {
        status: "incompatible",
        componentCategories: ["ram", "motherboard"],
        message: `La memoria RAM es ${ram.specs.ramType.toUpperCase()}, pero la placa madre ${motherboard.name} solo soporta ${motherboard.specs.ramType.toUpperCase()}.`,
        code: "RAM_MB_TYPE_MISMATCH",
      },
    ];
  }
  return [];
};

/** RAM ↔ Motherboard — module count must not exceed available slots. */
const checkRamSlotCount: CompatibilityRule = (build) => {
  const { ram, motherboard } = build;
  if (!ram?.specs || !motherboard?.specs) return [];

  if (ram.specs.modules > motherboard.specs.ramSlots) {
    return [
      {
        status: "incompatible",
        componentCategories: ["ram", "motherboard"],
        message: `El kit de RAM tiene ${ram.specs.modules} módulos, pero la placa madre ${motherboard.name} solo tiene ${motherboard.specs.ramSlots} slots disponibles.`,
        code: "RAM_MB_SLOT_OVERFLOW",
      },
    ];
  }
  return [];
};

/** Motherboard ↔ Case — form factor must be supported. */
const checkMotherboardCaseFormFactor: CompatibilityRule = (build) => {
  const { motherboard, case: pcCase } = build;
  if (!motherboard?.specs || !pcCase?.specs) return [];

  const supported = pcCase.specs.supportedMotherboards.map((ff) =>
    ff.toLowerCase(),
  );
  if (!supported.includes(motherboard.specs.formFactor.toLowerCase())) {
    return [
      {
        status: "incompatible",
        componentCategories: ["motherboard", "case"],
        message: `La placa madre ${motherboard.name} (${motherboard.specs.formFactor}) no es compatible con el gabinete ${pcCase.name}, que soporta: ${pcCase.specs.supportedMotherboards.join(", ")}.`,
        code: "MB_CASE_FORMFACTOR_MISMATCH",
      },
    ];
  }
  return [];
};

/** GPU ↔ Case — card length must fit. */
const checkGpuCaseLength: CompatibilityRule = (build) => {
  const { gpu, case: pcCase } = build;
  if (!gpu?.specs || !pcCase?.specs) return [];

  if (gpu.specs.length > pcCase.specs.maxGpuLength) {
    return [
      {
        status: "incompatible",
        componentCategories: ["gpu", "case"],
        message: `La tarjeta gráfica ${gpu.name} mide ${gpu.specs.length} mm, pero el gabinete ${pcCase.name} soporta hasta ${pcCase.specs.maxGpuLength} mm.`,
        code: "GPU_CASE_LENGTH_EXCEEDED",
      },
    ];
  }
  return [];
};

/** Cooler ↔ CPU — cooler must support the CPU socket. */
const checkCoolerCpuSocket: CompatibilityRule = (build) => {
  const { cooler, cpu } = build;
  if (!cooler?.specs || !cpu?.specs) return [];

  const supported = cooler.specs.supportedSockets.map((s) => s.toLowerCase());
  if (!supported.includes(cpu.specs.socket.toLowerCase())) {
    return [
      {
        status: "incompatible",
        componentCategories: ["cooler", "cpu"],
        message: `El cooler ${cooler.name} no soporta el socket ${cpu.specs.socket} del procesador ${cpu.name}. Sockets compatibles: ${cooler.specs.supportedSockets.join(", ")}.`,
        code: "COOLER_CPU_SOCKET_MISMATCH",
      },
    ];
  }
  return [];
};

/** Cooler (air) ↔ Case — tower height must fit. */
const checkCoolerCaseHeight: CompatibilityRule = (build) => {
  const { cooler, case: pcCase } = build;
  if (!cooler?.specs || !pcCase?.specs) return [];

  if (cooler.specs.type === "air" && cooler.specs.height != null) {
    if (cooler.specs.height > pcCase.specs.maxCoolerHeight) {
      return [
        {
          status: "incompatible",
          componentCategories: ["cooler", "case"],
          message: `El cooler ${cooler.name} mide ${cooler.specs.height} mm de alto, pero el gabinete ${pcCase.name} soporta hasta ${pcCase.specs.maxCoolerHeight} mm.`,
          code: "COOLER_CASE_HEIGHT_EXCEEDED",
        },
      ];
    }
  }
  return [];
};

/** Cooler (AIO) ↔ Case — radiator size must be supported. */
const checkCoolerCaseRadiator: CompatibilityRule = (build) => {
  const { cooler, case: pcCase } = build;
  if (!cooler?.specs || !pcCase?.specs) return [];

  if (
    cooler.specs.type === "aio" &&
    cooler.specs.radiatorSize != null &&
    pcCase.specs.radiatorSupport.length > 0
  ) {
    const supported = pcCase.specs.radiatorSupport.map((r) => r.toLowerCase());
    if (!supported.includes(cooler.specs.radiatorSize.toLowerCase())) {
      return [
        {
          status: "warning",
          componentCategories: ["cooler", "case"],
          message: `El radiador de ${cooler.specs.radiatorSize} del cooler ${cooler.name} podría no ser compatible con el gabinete ${pcCase.name}. Radiadores soportados: ${pcCase.specs.radiatorSupport.join(", ")}.`,
          code: "COOLER_CASE_RADIATOR_UNSUPPORTED",
        },
      ];
    }
  }
  return [];
};

/** PSU ↔ Case — PSU form factor must be supported. */
const checkPsuCaseFormFactor: CompatibilityRule = (build) => {
  const { psu, case: pcCase } = build;
  if (!psu?.specs || !pcCase?.specs) return [];

  const supported = pcCase.specs.supportedPsuFormFactors.map((ff) =>
    ff.toLowerCase(),
  );
  if (!supported.includes(psu.specs.formFactor.toLowerCase())) {
    return [
      {
        status: "incompatible",
        componentCategories: ["psu", "case"],
        message: `La fuente ${psu.name} (${psu.specs.formFactor.toUpperCase()}) no es compatible con el gabinete ${pcCase.name}. Formatos soportados: ${pcCase.specs.supportedPsuFormFactors.join(", ")}.`,
        code: "PSU_CASE_FORMFACTOR_MISMATCH",
      },
    ];
  }
  return [];
};

/** PSU ↔ Build — total estimated wattage vs PSU capacity. */
const checkPsuWattage: CompatibilityRule = (build) => {
  const { psu } = build;
  if (!psu?.specs) return [];

  const totalWattage = estimateTotalWattage(build);
  const ratio = totalWattage / psu.specs.wattage;

  if (ratio > 1) {
    return [
      {
        status: "incompatible",
        componentCategories: ["psu"],
        message: `El consumo estimado del sistema (${totalWattage}W) supera la capacidad de la fuente ${psu.name} (${psu.specs.wattage}W).`,
        code: "PSU_WATTAGE_EXCEEDED",
      },
    ];
  }

  if (ratio > 0.8) {
    return [
      {
        status: "warning",
        componentCategories: ["psu"],
        message: `El consumo estimado del sistema (${totalWattage}W) supera el 80% de la capacidad de la fuente ${psu.name} (${psu.specs.wattage}W). Se recomienda una fuente de mayor capacidad.`,
        code: "PSU_WATTAGE_TIGHT",
      },
    ];
  }

  return [];
};

// ---------------------------------------------------------------------------
// Wattage estimation helper
// ---------------------------------------------------------------------------

/**
 * Conservative wattage estimate based on real component data.
 * Sums actual power draw from all present components without fixed assumptions.
 */
export function estimateTotalWattage(build: BuildSelection): number {
  let watts = 0;

  // CPU TDP — most reliable spec for power draw
  const cpu = build.cpu as CPUComponent | undefined;
  if (cpu?.specs?.tdp) {
    watts += cpu.specs.tdp;
  }

  // GPU — use recommendedPsuWattage as a proxy for the card's own draw.
  // The "recommended" value from AIBs already includes system headroom,
  // so we take 65% as the card-level draw.
  const gpu = build.gpu as GPUComponent | undefined;
  if (gpu?.specs?.recommendedPsuWattage) {
    watts += Math.round(gpu.specs.recommendedPsuWattage * 0.65);
  }

  // Motherboard — small fixed draw, only if present
  if (build.motherboard) {
    watts += 30; // typical chipset + VRM + peripherals
  }

  // RAM — minimal draw per module
  const ram = build.ram;
  if (ram?.specs?.modules) {
    watts += ram.specs.modules * 3; // ~3W per module
  }

  // Storage — minimal draw per device
  if (build.storage && build.storage.length > 0) {
    watts += build.storage.length * 5; // ~5W per storage device
  }

  // Cooler — add if liquid cooled (pump + fans)
  const cooler = build.cooler;
  if (cooler?.specs?.type === "aio") {
    watts += 15; // pump + fans
  } else if (cooler?.specs?.type === "air") {
    watts += 5; // fans only
  }

  // Case — minimal draw for fans
  if (build.case) {
    watts += 10; // case fans
  }

  return Math.max(watts, 50); // minimum 50W for any system
}

// ---------------------------------------------------------------------------
// Rule registry — add new rules here
// ---------------------------------------------------------------------------

const rules: CompatibilityRule[] = [
  // Completeness check must run first to prevent cascading errors
  checkBuildCompleteness,
  checkCpuMotherboardSocket,
  checkRamMotherboardType,
  checkRamSlotCount,
  checkMotherboardCaseFormFactor,
  checkGpuCaseLength,
  checkCoolerCpuSocket,
  checkCoolerCaseHeight,
  checkCoolerCaseRadiator,
  checkPsuCaseFormFactor,
  checkPsuWattage,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a build selection against all compatibility rules.
 *
 * @returns A `BuildCompatibilityReport` with the overall status,
 *          individual issues, and an estimated total wattage.
 */
export function evaluateBuild(
  build: BuildSelection,
): BuildCompatibilityReport {
  const issues: CompatibilityIssue[] = rules.flatMap((rule) => rule(build));

  const status: CompatibilityStatus = deriveOverallStatus(issues);
  const totalWattageEstimated = estimateTotalWattage(build);

  return { status, issues, totalWattageEstimated };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deriveOverallStatus(issues: CompatibilityIssue[]): CompatibilityStatus {
  if (issues.some((i) => i.status === "incomplete")) return "incomplete";
  if (issues.some((i) => i.status === "incompatible")) return "incompatible";
  if (issues.some((i) => i.status === "warning")) return "warning";
  return "compatible";
}
