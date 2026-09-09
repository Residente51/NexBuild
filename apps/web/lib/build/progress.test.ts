import { describe, expect, it } from "vitest";
import { getBuildProgress } from "@/lib/build/progress";
import {
  caseNzxtH6Flow,
  coolerAio,
  cpuRyzen7_7700X,
  mbMsiB650TomahawkWifi,
  psuCorsairRM850x,
  ramCorsairVengeanceDdr5,
  storageNvme,
} from "@/lib/seedData";
import type { BuildSelection, CPUComponent } from "@/types/component";

const emptyBuild: BuildSelection = { storage: [] };

describe("getBuildProgress", () => {
  it("starts with the six universally required categories", () => {
    expect(getBuildProgress(emptyBuild)).toMatchObject({
      completed: 0,
      total: 6,
      percentage: 0,
      isComplete: false,
      missingCategories: [
        "cpu",
        "motherboard",
        "ram",
        "storage",
        "psu",
        "case",
      ],
    });
  });

  it("requires a cooler only when the selected CPU does not include one", () => {
    const progress = getBuildProgress({
      ...emptyBuild,
      cpu: cpuRyzen7_7700X,
    });

    expect(progress.total).toBe(7);
    expect(progress.requiredCategories).toContain("cooler");
    expect(progress.requiredCategories).not.toContain("gpu");
  });

  it("requires a GPU only when the selected CPU lacks integrated graphics", () => {
    const cpu: CPUComponent = {
      ...cpuRyzen7_7700X,
      specs: {
        ...cpuRyzen7_7700X.specs!,
        hasIntegratedGraphics: false,
        includesCooler: true,
      },
    };
    const progress = getBuildProgress({ ...emptyBuild, cpu });

    expect(progress.total).toBe(7);
    expect(progress.requiredCategories).toContain("gpu");
    expect(progress.requiredCategories).not.toContain("cooler");
  });

  it("counts duplicated storage as one completed required slot", () => {
    const progress = getBuildProgress({
      cpu: cpuRyzen7_7700X,
      motherboard: mbMsiB650TomahawkWifi,
      ram: ramCorsairVengeanceDdr5,
      storage: [storageNvme, storageNvme],
      case: caseNzxtH6Flow,
      cooler: coolerAio,
      psu: psuCorsairRM850x,
    });

    expect(progress).toMatchObject({
      completed: 7,
      total: 7,
      percentage: 100,
      isComplete: true,
      missingCategories: [],
    });
  });
});
