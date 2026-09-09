import type { PCComponent } from "@/types/component";

export interface TechnicalSpecification {
  label: string;
  value: string;
}

function formatNumber(value: number): string {
  return value.toLocaleString("es-CL");
}

function formatCapacity(value: number): string {
  if (value < 1_000) return `${formatNumber(value)} GB`;

  return `${(value / 1_000).toLocaleString("es-CL", {
    maximumFractionDigits: 2,
  })} TB`;
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "No especificado";
}

export function getTechnicalSpecifications(
  component: PCComponent,
): TechnicalSpecification[] {
  switch (component.category) {
    case "cpu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.cores
          ? [{ label: "Núcleos", value: formatNumber(specs.cores) }]
          : []),
        { label: "Socket", value: specs.socket },
        { label: "TDP", value: `${formatNumber(specs.tdp)} W` },
        {
          label: "Gráficos integrados",
          value: specs.hasIntegratedGraphics ? "Sí" : "No",
        },
        {
          label: "Refrigeración incluida",
          value: specs.includesCooler ? "Sí" : "No",
        },
      ];
    }

    case "motherboard": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.chipset
          ? [{ label: "Chipset", value: specs.chipset }]
          : []),
        { label: "Socket", value: specs.socket },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        { label: "Tipo de memoria", value: specs.ramType.toUpperCase() },
        { label: "Ranuras RAM", value: formatNumber(specs.ramSlots) },
        { label: "Ranuras M.2", value: formatNumber(specs.m2Slots) },
        { label: "Puertos SATA", value: formatNumber(specs.sataPorts) },
      ];
    }

    case "ram": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo de memoria", value: specs.ramType.toUpperCase() },
        { label: "Módulos", value: formatNumber(specs.modules) },
        {
          label: "Capacidad por módulo",
          value: `${formatNumber(specs.capacityPerModule)} GB`,
        },
        ...(specs.speed
          ? [{ label: "Velocidad", value: `${formatNumber(specs.speed)} MHz` }]
          : []),
      ];
    }

    case "gpu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        ...(specs.vram
          ? [{ label: "VRAM", value: `${formatNumber(specs.vram)} GB` }]
          : []),
        ...(specs.memoryType
          ? [{ label: "Tipo de memoria", value: specs.memoryType }]
          : []),
        { label: "Largo", value: `${formatNumber(specs.length)} mm` },
        { label: "Ancho", value: `${formatNumber(specs.slotWidth)} slots` },
        ...(specs.powerDraw
          ? [{ label: "Consumo", value: `${formatNumber(specs.powerDraw)} W` }]
          : []),
        ...(specs.tdp
          ? [{ label: "TDP", value: `${formatNumber(specs.tdp)} W` }]
          : []),
        {
          label: "Fuente recomendada",
          value: `${formatNumber(specs.recommendedPsuWattage)} W`,
        },
      ];
    }

    case "storage": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo", value: specs.type.toUpperCase() },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        { label: "Capacidad", value: formatCapacity(specs.capacity) },
        ...(specs.readSpeed
          ? [
              {
                label: "Velocidad de lectura",
                value: `${formatNumber(specs.readSpeed)} MB/s`,
              },
            ]
          : []),
      ];
    }

    case "psu": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Potencia", value: `${formatNumber(specs.wattage)} W` },
        { label: "Formato", value: specs.formFactor.toUpperCase() },
        ...(specs.certification
          ? [{ label: "Certificación", value: specs.certification }]
          : []),
      ];
    }

    case "case": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        {
          label: "Placas madre compatibles",
          value: formatList(specs.supportedMotherboards),
        },
        {
          label: "Largo máximo de GPU",
          value: `${formatNumber(specs.maxGpuLength)} mm`,
        },
        ...(specs.maxGpuSlotWidth
          ? [
              {
                label: "Ancho máximo de GPU",
                value: `${formatNumber(specs.maxGpuSlotWidth)} slots`,
              },
            ]
          : []),
        {
          label: "Altura máxima del cooler",
          value: `${formatNumber(specs.maxCoolerHeight)} mm`,
        },
        {
          label: "Formatos de fuente",
          value: formatList(
            specs.supportedPsuFormFactors.map((value) => value.toUpperCase()),
          ),
        },
        {
          label: "Soporte de radiadores",
          value: formatList(specs.radiatorSupport),
        },
      ];
    }

    case "cooler": {
      const specs = component.specs;
      if (!specs) return [];
      return [
        { label: "Tipo", value: specs.type === "air" ? "Aire" : "AIO" },
        {
          label: "Sockets compatibles",
          value: formatList(specs.supportedSockets),
        },
        ...(specs.height
          ? [{ label: "Altura", value: `${formatNumber(specs.height)} mm` }]
          : []),
        ...(specs.radiatorSize
          ? [{ label: "Radiador", value: specs.radiatorSize }]
          : []),
      ];
    }
  }
}

export function getStockLabel(component: PCComponent): string {
  if (component.inStock === true) return "Disponible";
  if (component.inStock === false) return "Sin stock";
  return "Disponibilidad no informada";
}
