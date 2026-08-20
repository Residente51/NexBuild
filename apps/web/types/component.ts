/**
 * PC Component model and domain types.
 */

import type { ComponentCategory } from "@/lib/categories";

export interface BaseComponent {
  id: number;
  /**
   * Permanent URL identifier, prefixed with the brand.
   * Never regenerate it from `name` — display names may change,
   * slugs must not.
   */
  slug: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  price: number;
  image?: string;
}

export interface CPUComponent extends BaseComponent {
  category: "cpu";
  specs?: {
    socket: string;
    tdp: number;
    hasIntegratedGraphics: boolean;
    includesCooler: boolean;
  };
}

export interface MotherboardComponent extends BaseComponent {
  category: "motherboard";
  specs?: {
    socket: string;
    formFactor: string;
    ramType: "ddr4" | "ddr5";
    ramSlots: number;
    m2Slots: number;
    sataPorts: number;
  };
}

export interface RAMComponent extends BaseComponent {
  category: "ram";
  specs?: {
    ramType: "ddr4" | "ddr5";
    modules: number;
    capacityPerModule: number;
  };
}

export interface GPUComponent extends BaseComponent {
  category: "gpu";
  specs?: {
    length: number;
    slotWidth: number;
    recommendedPsuWattage: number;
  };
}

export interface StorageComponent extends BaseComponent {
  category: "storage";
  specs?: {
    type: "nvme" | "sata";
    formFactor: "m.2 2280" | "2.5" | "3.5";
    capacity: number;
  };
}

export interface PSUComponent extends BaseComponent {
  category: "psu";
  specs?: {
    wattage: number;
    formFactor: "atx" | "sfx" | "sfx-l";
  };
}

export interface CaseComponent extends BaseComponent {
  category: "case";
  specs?: {
    supportedMotherboards: string[];
    maxGpuLength: number;
    maxCoolerHeight: number;
    supportedPsuFormFactors: string[];
    radiatorSupport: string[];
  };
}

export interface CoolerComponent extends BaseComponent {
  category: "cooler";
  specs?: {
    type: "air" | "aio";
    supportedSockets: string[];
    height?: number; // Only needed if type === "air"
    radiatorSize?: string; // Only needed if type === "aio"
  };
}

export type PCComponent =
  | CPUComponent
  | MotherboardComponent
  | RAMComponent
  | GPUComponent
  | StorageComponent
  | PSUComponent
  | CaseComponent
  | CoolerComponent;

export type BuildSelection = {
  cpu?: CPUComponent;
  motherboard?: MotherboardComponent;
  ram?: RAMComponent;
  gpu?: GPUComponent;
  storage: StorageComponent[];
  case?: CaseComponent;
  cooler?: CoolerComponent;
  psu?: PSUComponent;
};

export type CompatibilityStatus = "compatible" | "warning" | "incompatible";

export interface CompatibilityIssue {
  status: "warning" | "incompatible";
  componentCategories: ComponentCategory[];
  message: string;
  code: string;
}

export interface BuildCompatibilityReport {
  status: CompatibilityStatus;
  issues: CompatibilityIssue[];
  totalWattageEstimated: number;
}

export type CompatibilityRule = (build: BuildSelection) => CompatibilityIssue[];