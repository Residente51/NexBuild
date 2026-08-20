/**
 * Component categories.
 *
 * Keys are English domain identifiers used throughout the codebase.
 * Labels are the Spanish strings rendered in the UI.
 */

export const COMPONENT_CATEGORIES = [
  "cpu",
  "gpu",
  "ram",
  "storage",
  "motherboard",
  "case",
  "cooler",
  "psu",
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  cpu: "Procesador",
  gpu: "Tarjeta Gráfica",
  ram: "Memoria RAM",
  storage: "Almacenamiento",
  motherboard: "Placa Madre",
  case: "Gabinete",
  cooler: "Refrigeración",
  psu: "Fuente de Poder",
};
